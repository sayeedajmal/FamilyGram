package com.strong.familyfeed.Repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.strong.familyfeed.Model.Post;

public interface PostRepo extends MongoRepository<Post, String> {

    @Query(value = "{ 'userId': ?0 }", sort = "{ 'likesCount': -1, 'commentsCount': -1 }")
    List<Post> findTopEngagedPostsByUserId(String userId, Pageable pageable);
}
