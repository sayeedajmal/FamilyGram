package com.strong.familypost.Repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;
import com.strong.familypost.Model.Post;

public interface PostRepo extends MongoRepository<Post, String> {

    List<Post> findByUserId(String id);

    @Query(value = "{ 'userId': ?0 }", sort = "{ 'likesCount': -1, 'commentsCount': -1 }")
    List<Post> findTopEngagedPostsByUserId(String userId, Pageable pageable);
}
