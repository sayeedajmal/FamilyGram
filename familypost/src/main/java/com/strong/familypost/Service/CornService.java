package com.strong.familypost.Service;

import java.math.BigInteger;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.strong.familypost.Model.Post;
import com.strong.familypost.Repository.PostRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CornService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MongoTemplate mongoTemplate;
    private final PostRepo postRepo;

    @Scheduled(fixedRate = 1 * 60 * 1000) // every 5 mins
    public void syncLikesToDB() {
        // System.out.println("⏰ Running CRON to sync post likes...");

        Set<String> keys = redisTemplate.keys("post_like:*");
        if (keys == null || keys.isEmpty())
            return;

        List<Query> queries = new ArrayList<>();
        List<Update> updates = new ArrayList<>();

        for (String key : keys) {
            try {
                String postId = key.replace("post_like:", "");
                Set<Object> redisUserIds = redisTemplate.opsForSet().members(key);

                if (redisUserIds == null || redisUserIds.isEmpty())
                    continue;

                Set<String> redisLikes = redisUserIds.stream()
                        .map(Object::toString)
                        .collect(Collectors.toSet());

                // 🧠 Get existing likes from MongoDB
                Optional<Post> optionalPost = postRepo.findById(postId);
                Set<String> finalLikes = new HashSet<>(redisLikes);

                BigInteger likeCount = BigInteger.valueOf(finalLikes.size());
                if (optionalPost.isPresent()) {
                    Post updatedPost = optionalPost.get();
                    updatedPost.setLikes(finalLikes);
                    updatedPost.setLikeCount(likeCount);

                    String userId = updatedPost.getUserId();
                    String feedKey = "posts:" + userId;

                    redisTemplate.opsForHash().put(feedKey, postId, updatedPost);
                }
                // ✅ Prepare update
                Query query = new Query(Criteria.where("_id").is(postId));
                Update update = new Update()
                        .set("likes", finalLikes)
                        .set("likeCount", likeCount);

                queries.add(query);
                updates.add(update);

            } catch (Exception e) {
                // System.err.println("❌ Error preparing update for key: " + key);
                e.printStackTrace();
            }
        }

        try {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Post.class);
            for (int i = 0; i < queries.size(); i++) {
                bulkOps.updateOne(queries.get(i), updates.get(i));
            }
            bulkOps.execute();

            // System.out.println("✅ Bulk update completed for " + queries.size() + " posts");

            // Cleanup Redis keys
            redisTemplate.delete(keys);

        } catch (Exception e) {
            // System.err.println("❌ Bulk update failed");
            e.printStackTrace();
        }
    }
}
