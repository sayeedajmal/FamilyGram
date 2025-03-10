package com.strong.familypost.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familypost.Model.Post;

public interface PostRepo extends MongoRepository<Post, String> {
    

}
