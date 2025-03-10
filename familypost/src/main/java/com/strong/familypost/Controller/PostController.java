package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.Post;
import com.strong.familypost.Service.CommentService;
import com.strong.familypost.Service.PostService;
import com.strong.familypost.Util.PostException;
import com.strong.familypost.Util.ResponseWrapper;

@RestController
@RequestMapping("/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    /**
     * Creates a new post
     */
    @PostMapping
    public ResponseEntity<ResponseWrapper<Post>> createPost(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("post") String postJson) throws PostException {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Post post = objectMapper.readValue(postJson, Post.class);
            Post savedPost = postService.savePost(file, post);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post created successfully", savedPost));
        } catch (JsonProcessingException e) {
            throw new PostException("Error processing JSON: " + e.getMessage());
        }
    }

    /**
     * Retrieves all posts
     */
    @GetMapping
    public ResponseEntity<ResponseWrapper<List<Post>>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Posts retrieved successfully", posts));
    }

    /**
     * Retrieves a specific post by ID
     */
    @GetMapping("/{postId}")
    public ResponseEntity<ResponseWrapper<Post>> getPost(@PathVariable String postId) {
        try {
            Post post = postService.getPost(postId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post retrieved successfully", post));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "Post not found", null));
        }
    }

    /**
     * Deletes a post by ID
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<ResponseWrapper<Void>> deletePost(@PathVariable String postId) {
        try {
            postService.deletePost(postId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post deleted successfully", null));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "Post not found", null));
        }
    }

    /**
     * Toggles like status for a post
     */
    @PostMapping("/{postId}/toggle-like")
    public ResponseEntity<ResponseWrapper<Integer>> toggleLike(@PathVariable String postId,
            @RequestHeader("userId") String userId) {
        try {
            int totalLikes = postService.toggleLike(postId, userId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Like toggled successfully", totalLikes));
        } catch (PostException e) {
            return ResponseEntity.badRequest().body(new ResponseWrapper<>(400, "Error toggling like", 0));
        }
    }

    /**
     * Retrieves all comments for a specific post
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<ResponseWrapper<List<Comment>>> getComments(@PathVariable String postId)
            throws PostException {
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comments retrieved successfully", comments));
    }
}
