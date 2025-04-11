package com.strong.familyfeed.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.strong.familyfeed.Model.LiteUser;
import com.strong.familyfeed.Model.Post;
import com.strong.familyfeed.Model.PostWithUser;
import com.strong.familyfeed.Repository.PostRepo;
import com.strong.familyfeed.Util.ResponseWrapper;

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
        String cacheKey = "user_feed:" + mineId;
        ValueOperations<String, Object> valueOps = redisTemplate.opsForValue();

        List<PostWithUser> cachedFeed = (List<PostWithUser>) valueOps.get(cacheKey);
        if (cachedFeed != null) {
            return cachedFeed;
        }

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
                        Collectors.toCollection(LinkedHashSet::new),
                        list -> {
                            List<PostWithUser> finalList = new ArrayList<>(list);
                            Collections.shuffle(finalList);
                            return finalList;
                        }));

        valueOps.set(cacheKey, freshFeed, 10, TimeUnit.MINUTES);
        return freshFeed;
    }

    public List<PostWithUser> getPagedFeedPosts(String mineId, int page, int size, String token) {
        String cacheKey = "user_feed:" + mineId;
        ValueOperations<String, Object> valueOps = redisTemplate.opsForValue();

        @SuppressWarnings("unchecked")
        List<PostWithUser> fullFeed = (List<PostWithUser>) valueOps.get(cacheKey);

        if (fullFeed == null) {
            fullFeed = getRandomFeedPosts(mineId, 10, token);
        }

        int start = page * size;
        int end = Math.min(start + size, fullFeed.size());

        if (start >= fullFeed.size()) {
            return List.of();
        }

        // 🔥 Detect if this is the last page
        boolean isLastPage = end >= fullFeed.size();

        if (isLastPage) {
            // 🧠 Background refresh
            refreshFeedAsync(mineId, size, token);
        }

        return fullFeed.subList(start, end);
    }

    @Async
    public void refreshFeedAsync(String mineId, int size, String token) {
        String cacheKey = "user_feed:" + mineId;
        redisTemplate.delete(cacheKey); // Clear old
        getRandomFeedPosts(mineId, size, token); // Generate fresh and cache it
    }
}
