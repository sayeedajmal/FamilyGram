package com.strong.familypost.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familypost.Model.Comment;

public interface CommentRepo extends MongoRepository<Comment, String> {

    List<Comment> findByPostId(String postId);

    void deleteByPostId(String postId);

}
