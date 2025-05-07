package com.strong.familypost.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familypost.Model.Like;

public interface LikeRepo extends MongoRepository<Like, String> {

   Like findByPostId(String postId);
    
}
