package com.strong.familypost.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
                // Step 2: Try uploading media and thumbnails
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

                // Step 4: Save post with updated media references
                postRepo.save(savedPost);
            }

            return savedPost;

        } catch (PostException e) {
            throw e; // Preserve PostException messages
        } catch (Exception e) {
            throw new PostException("Error saving post: " + e.getMessage());
        }
    }

    /**
     * Deletes a post and all its associated comments from the database.
     * 
     * @param postId The unique identifier of the post to be deleted
     * @throws PostException        if the postId is null or empty, or if no post
     *                              exists with the given id
     * @throws TransactionException if there's a failure in the transaction during
     *                              deletion
     */
    @Transactional
    public void deletePost(String postId) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!postId.equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }
        if (!postRepo.existsById(postId)) {
            throw new PostException("No Post with id: " + postId);
        }

        commentRepo.deleteByPostId(postId);

        postRepo.deleteById(postId);
    }

    /**
     * Retrieves a post by its ID.
     * 
     * @param postId The unique identifier of the post to retrieve
     * @return The Post object if found
     * @throws PostException if the postId is null or empty, or if no post exists
     *                       with the given id
     */
    public Post getPostById(String userId, String postId, String token) throws PostException {
        String authenticatedUserId = getAuthenticatedUserId();
        try {
            // Call FamilyAuth Service to check privacy settings
            ResponseEntity<String> response = client.getUserPrivacy(authenticatedUserId, userId, token);

            if (response.getStatusCode().is2xxSuccessful()) {
                return postRepo.findById(postId)
                        .orElseThrow(() -> new PostException("No Post with postId: " + postId));
            } else {
                throw new PostException("Account is Private", HttpStatus.UNAUTHORIZED);
            }

        } catch (Exception e) {
            throw new PostException("Error retrieving posts: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves all posts from the database.
     * 
     * @return A List containing all Post objects
     */
    public List<Post> getUserPosts(String userId, String token) throws PostException {
        String authenticatedUserId = getAuthenticatedUserId();
        if (userId.equals(authenticatedUserId)) {
            return postRepo.findByUserId(userId);
        }
        try {
            // Call FamilyAuth Service to check privacy settings
            ResponseEntity<String> response = client.getUserPrivacy(authenticatedUserId, userId, token);

            if (response.getStatusCode().is2xxSuccessful()) {
                return postRepo.findByUserId(userId);
            } else {
                throw new PostException("Account is Private", HttpStatus.UNAUTHORIZED);
            }

        } catch (Exception e) {
            throw new PostException("Error retrieving posts: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggles a like on a post for a specific user.
     * If the user has already liked the post, their like is removed.
     * If the user hasn't liked the post, a like is added.
     * 
     * @param postId The unique identifier of the post
     * @param userId The unique identifier of the user toggling the like
     * @return The updated number of likes on the post
     * @throws PostException if the post cannot be found or if there's an error
     *                       processing the like
     */
    public int toggleLike(String postId, String userId, String token) throws PostException {
        Post post = getPostById(userId, postId, token);
        Set<String> likes = post.getLikes();

        if (likes == null) {
            likes = new HashSet<>();
        }

        if (likes.contains(userId)) {
            likes.remove(userId);
        } else {
            likes.add(userId);
        }

        post.setLikes(likes);
        postRepo.save(post);
        return likes.size();
    }

}
