package com.strong.familypost.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familypost.Model.Post;

public interface PostRepo extends MongoRepository<Post, String> {
    List<Post> findByUserId(String id);
}
