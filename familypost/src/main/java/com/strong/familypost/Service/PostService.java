package com.strong.familypost.Service;

import java.math.BigInteger;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.strong.familypost.Model.Post;
import com.strong.familypost.Model.User;
import com.strong.familypost.Repository.CommentRepo;
import com.strong.familypost.Repository.PostRepo;
import com.strong.familypost.Util.PostException;

/**
 * Service class responsible for managing Post-related operations.
 * This service provides methods for creating, retrieving, deleting, and
 * managing likes on posts.
 *
 * @author FamilyGram
 * @version 1.0
 */

@Service
public class PostService {

    @Autowired
    private PostRepo postRepo;

    @Autowired
    private CommentRepo commentRepo;

    @Autowired
    private StorageService storageService;

    @Autowired
    private UserServiceClient client;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private String getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            User userDetails = (User) principal;
            // Return the username
            return userDetails.getId();
        }

        return null;
    }

    /**
     * Saves a new post to the repository with media attachments.
     *
     * @param files      List of media files (images/videos)
     * @param thumbnails List of corresponding thumbnail images
     * @param post       The post object to be saved
     * @return The saved post object
     * @throws PostException If the post object is null or unauthorized
     */
    @Transactional
    public Post savePost(List<MultipartFile> files, List<MultipartFile> thumbnails, Post post) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!post.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this resource");
        }

        try {
            // Step 1: Save post first to generate an ID
            Post savedPost = postRepo.save(post);

            // Initialize media and thumbnail lists if null
            if (savedPost.getMediaIds() == null) {
                savedPost.setMediaIds(new ArrayList<>());
            }
            if (savedPost.getThumbnailIds() == null) {
                savedPost.setThumbnailIds(new ArrayList<>());
            }

            if (files != null && !files.isEmpty()) {
                // Step 2: Upload media and thumbnails
                List<Map<String, String>> uploadedFiles;
                try {
                    uploadedFiles = storageService.uploadMedia(files, thumbnails, savedPost.getId());
                } catch (Exception e) {
                    throw new PostException("Media upload failed, rolling back: " + e.getMessage());
                }

                // Step 3: Extract media and thumbnail IDs
                for (Map<String, String> mediaData : uploadedFiles) {
                    savedPost.getMediaIds().add(mediaData.get("mediaId"));
                    savedPost.getThumbnailIds().add(mediaData.get("thumbnailId"));
                }

                // Step 4: Save post again with media references
                savedPost.setLikeCount(BigInteger.valueOf(0));
                savedPost = postRepo.save(savedPost);
            }

            // Step 5: Cache in Redis as HASH
            String cacheKey = "posts:" + savedPost.getUserId(); // Hash key
            String postId = savedPost.getId(); // Hash field

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            String jsonPost = mapper.writeValueAsString(savedPost);

            redisTemplate.opsForHash().put(cacheKey, postId, jsonPost);

            return savedPost;
        } catch (PostException e) {
            throw e;
        } catch (Exception e) {
            throw new PostException("Error saving post: " + e.getMessage());
        }
    }

    /**
     * Deletes a post and all its associated comments from the database.
     * Also removes the post from Redis cache if it exists.
     * 
     * @param postId The unique identifier of the post to be deleted
     * @throws PostException        if the postId is null or empty, or if no post
     *                              exists with the given id
     * @throws TransactionException if there's a failure in the transaction during
     *                              deletion
     */
    @Transactional
    public void deletePost(String postId) throws PostException {
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new PostException("No Post with id: " + postId));

        String loggedId = getAuthenticatedUserId();

        // Check if the logged-in user is the owner of the post
        if (!post.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        // Delete all comments associated with the post
        commentRepo.deleteByPostId(postId);

        // Delete post from database
        postRepo.deleteById(postId);

        // Update Redis cache - remove the post if it exists in cache
        String cacheKey = "posts:" + post.getUserId();
        List<?> cachedList = (List<?>) redisTemplate.opsForValue().get(cacheKey);

        if (cachedList != null) {
            List<Post> updatedList = new ArrayList<>();

            for (Object obj : cachedList) {
                if (obj instanceof Post) {
                    Post cachedPost = (Post) obj;
                    if (!cachedPost.getId().equals(postId)) {
                        updatedList.add(cachedPost); // Keep posts that aren't being deleted
                    }
                }
            }

            // Update the cache with the filtered list
            redisTemplate.opsForValue().set(cacheKey, updatedList, Duration.ofMinutes(20));
        }
    }

    /**
     * Retrieves a post by its ID.
     * 
     * @param postId The unique identifier of the post to retrieve
     * @return The Post object if found
     * @throws PostException if the postId is null or empty, or if no post exists
     *                       with the given id
     */
    public Post getPostById(String postId, String userId) throws PostException {
        try {
            String redisHashKey = "posts:" + userId;

            // Step 1: Try getting from Redis Hash
            Object cached = redisTemplate.opsForHash().get(redisHashKey, postId);
            if (cached != null) {
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

                if (cached instanceof String) {
                    return mapper.readValue((String) cached, Post.class);
                } else if (cached instanceof Map) {
                    return mapper.convertValue(cached, Post.class);
                }
            }

            // Step 2: Fallback to DB
            Post post = postRepo.findById(postId)
                    .orElseThrow(() -> new PostException("No Post with postId: " + postId));

            // Step 3: Cache it in Redis for next time
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            String json = mapper.writeValueAsString(post);

            redisTemplate.opsForHash().put(redisHashKey, postId, json);

            return post;

        } catch (Exception e) {
            e.printStackTrace();
            throw new PostException("Error getting post: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves all posts for a specific user, with caching.
     * 
     * @param userId The user ID whose posts to retrieve
     * @param token  Authentication token for privacy checks
     * @return A List containing all Post objects for the user
     * @throws PostException if there's an error retrieving the posts or if privacy
     *                       settings prevent access
     */
    public List<Post> getUserPosts(String userId, String token) throws PostException {
        String authenticatedUserId = getAuthenticatedUserId();
        String cacheKey = "posts:" + userId;

        try {
            // 1️⃣ Try to fetch from Redis HASH
            Map<Object, Object> cachedMap = redisTemplate.opsForHash().entries(cacheKey);

            if (cachedMap != null && !cachedMap.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

                List<Post> posts = cachedMap.values().stream()
                        .map(obj -> {
                            try {
                                if (obj instanceof String) {
                                    return mapper.readValue((String) obj, Post.class);
                                } else if (obj instanceof Post) {
                                    return (Post) obj;
                                } else if (obj instanceof Map) {
                                    return mapper.convertValue(obj, Post.class);
                                } else {
                                    return null;
                                }
                            } catch (Exception e) {
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

                return posts;
            }

            // 2️⃣ Fetch from DB based on privacy
            if (userId.equals(authenticatedUserId)) {
                return fetchAndCachePosts(userId, cacheKey); // This should also store in Redis HASH
            }

            ResponseEntity<String> response = client.getUserPrivacy(authenticatedUserId, userId, token);
            if (response.getStatusCode().is2xxSuccessful()) {
                return fetchAndCachePosts(userId, cacheKey);
            } else {
                throw new PostException("Account is Private", HttpStatus.UNAUTHORIZED);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new PostException("Error retrieving posts: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Fetches posts from database and caches them in Redis.
     * 
     * @param userId   The user ID whose posts to fetch
     * @param cacheKey The Redis cache key
     * @return List of posts for the user
     */
    public List<Post> fetchAndCachePosts(String userId, String cacheKey) {
        List<Post> posts = postRepo.findByUserId(userId);
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        for (Post post : posts) {
            try {
                String json = mapper.writeValueAsString(post);
                redisTemplate.opsForHash().put(cacheKey, post.getId(), json);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }

        return posts;
    }

    public boolean toggleLike(String postId, String userId) throws PostException {
        String redisLikeKey = "post_like:" + postId;

        // Step 1: Check if user already liked
        Boolean hasLiked = redisTemplate.opsForSet().isMember(redisLikeKey, userId);

        boolean isLiked;
        if (Boolean.TRUE.equals(hasLiked)) {
            // User already liked → remove like
            redisTemplate.opsForSet().remove(redisLikeKey, userId);
            isLiked = false;
        } else {
            // User hasn't liked → add like
            redisTemplate.opsForSet().add(redisLikeKey, userId);
            isLiked = true;
        }
        return isLiked;
    }
}