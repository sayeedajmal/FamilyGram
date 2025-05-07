package com.strong.familypost.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.strong.familypost.Model.Like;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CornService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MongoTemplate mongoTemplate;

    @Scheduled(fixedRate = 2 * 60 * 1000) // every 2 minutes
    public void syncLikesToDB() {
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

                Set<String> userIds = redisUserIds.stream()
                        .map(Object::toString)
                        .collect(Collectors.toSet());

                // Build query to find Like document by postId
                Query query = new Query(Criteria.where("postId").is(postId));

                // Add the new likes to the existing set
                Update update = new Update().addToSet("likes").each(userIds.toArray());

                queries.add(query);
                updates.add(update);

            } catch (Exception e) {
                System.err.println("❌ Error preparing update for key: " + key);
                e.printStackTrace();
            }
        }

        if (!queries.isEmpty()) {
            try {
                BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Like.class);
                for (int i = 0; i < queries.size(); i++) {
                    bulkOps.updateOne(queries.get(i), updates.get(i));
                }
                bulkOps.execute();

                System.out.println("✅ Likes synced to DB for " + queries.size() + " posts");
            } catch (Exception e) {
                System.err.println("❌ Bulk update failed");
                e.printStackTrace();
            }
        }
    }

}
