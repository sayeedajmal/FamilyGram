package com.strong.familypost.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.strong.familypost.Model.Post;
import com.strong.familypost.Repository.CommentRepo;
import com.strong.familypost.Repository.PostRepo;
import com.strong.familypost.Util.PostException;

@Service
public class PostService {

    @Autowired
    private PostRepo postRepo;

    @Autowired
    private CommentRepo commentRepo;

    public Post savePost(Post post) throws PostException {
        if (post == null) {
            throw new PostException("Post cannot be null");
        }
        return postRepo.save(post);
    }

    @Transactional
    public void deletePost(String postId) throws PostException {
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }
        if (!postRepo.existsById(postId)) {
            throw new PostException("Post not found with id: " + postId);
        }

        commentRepo.deleteByPostId(postId);

        postRepo.deleteById(postId);
    }

    public Post getPost(String postId) throws PostException {
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }
        return postRepo.findById(postId)
                .orElseThrow(() -> new PostException("Post not found with id: " + postId));
    }

    public List<Post> getAllPosts() {
        return postRepo.findAll();
    }

    public Post likePost(String postId, String userId) throws PostException {
        Post post = getPost(postId);
        Set<String> likes = post.getLikes();
        if (likes == null) {
            likes = new HashSet<>();
        }
        if (!likes.contains(userId)) {
            likes.add(userId);
        }
        post.setLikes(likes);
        return postRepo.save(post);
    }

    public Post unlikePost(String postId, String userId) throws PostException {
        Post post = getPost(postId);
        Set<String> likes = post.getLikes();
        if (likes != null) {
            likes.remove(userId);
        }
        post.setLikes(likes);
        return postRepo.save(post);
    }
}
