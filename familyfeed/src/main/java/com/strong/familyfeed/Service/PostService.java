package com.strong.familyfeed.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.strong.familyfeed.Model.LiteUser;
import com.strong.familyfeed.Model.Post;
import com.strong.familyfeed.Model.PostWithUser;
import com.strong.familyfeed.Repository.PostRepo;
import com.strong.familyfeed.Util.ResponseWrapper;

/**
 * Service class responsible for managing Post-related operations.
 * This service provides methods for creating, retrieving, deleting, and
 * managing likes on Posts.
 *
 * @author FamilyGram
 * @version 1.0
 */

@Service
public class PostService {

    @Autowired
    private PostRepo postRepo;

    @Autowired
    private UserServiceClient client;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @SuppressWarnings({ "null", "unchecked" })
    public List<PostWithUser> getRandomFeedPosts(String mineId, int userLimit, String token) {
        String cacheKey = "user_feed:" + mineId; // 🔑 Unique key per user

        ValueOperations<String, Object> valueOps = redisTemplate.opsForValue();

        // ✅ Step 1: Check if feed is cached in Redis
        List<PostWithUser> cachedFeed = (List<PostWithUser>) valueOps.get(cacheKey);
        if (cachedFeed != null) {
            return cachedFeed;
        }

        // ✅ Step 2: If cache is empty, fetch from database
        ResponseEntity<ResponseWrapper<List<LiteUser>>> response = client.getRandomFeedUsers(mineId, userLimit, token);

        if (response.getBody() == null || response.getBody().getData() == null) {
            return List.of();
        }

        List<LiteUser> users = response.getBody().getData();

        Pageable pageable = PageRequest.of(0, 5);

        List<PostWithUser> freshFeed = users.stream()
                .flatMap(user -> {
                    List<Post> posts = postRepo.findTopEngagedPostsByUserId(user.getId(), pageable);
                    return posts.stream()
                            .filter(post -> post != null && post.getUserId() != null)
                            .map(post -> new PostWithUser(
                                    user.getUsername(),
                                    user.getName(),
                                    user.getThumbnailId(),
                                    post.getId(),
                                    post.getUserId(),
                                    post.getCaption(),
                                    post.getMediaIds() != null ? post.getMediaIds() : List.of(),
                                    post.getLocation(),
                                    post.getLikes() != null ? post.getLikes() : new HashSet<>(),
                                    post.getCreatedAt()));
                })
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(() -> new LinkedHashSet<>()), // 🔥 Removes duplicates
                        list -> {
                            List<PostWithUser> finalList = new ArrayList<>(list);
                            Collections.shuffle(finalList); // 🔀 Shuffle to randomize the feed
                            return finalList;
                        }));

        // ✅ Step 3: Store in Redis cache (Expires in 10 minutes)
        valueOps.set(cacheKey, freshFeed, 10, TimeUnit.MINUTES);
        return freshFeed;
    }

}
