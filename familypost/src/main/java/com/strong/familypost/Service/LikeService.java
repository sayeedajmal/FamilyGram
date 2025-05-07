package com.strong.familypost.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.strong.familypost.Util.PostException;

@Service
public class LikeService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

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
