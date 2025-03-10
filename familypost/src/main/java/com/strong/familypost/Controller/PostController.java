
package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.Post;
import com.strong.familypost.Service.CommentService;
import com.strong.familypost.Service.PostService;
import com.strong.familypost.Util.PostException;

/**
 * REST Controller for handling post-related operations in the FamilyGram
 * application.
 * This controller manages CRUD operations for posts, including creating,
 * retrieving,
 * deleting posts, and handling post-related actions such as likes and comments.
 * 
 * @author FamilyGram
 * @version 1.0
 */
@RestController
@RequestMapping("/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    /**
     * Creates a new post
     * 
     * @param post   The post object to be created
     * @param userId The ID of the user creating the post
     * @return ResponseEntity containing the saved post or null if creation fails
     */
    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post, @RequestHeader("userId") String userId) {
        try {
            Post savedPost = postService.savePost(post);
            return ResponseEntity.ok(savedPost);
        } catch (PostException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Retrieves all posts
     * 
     * @return ResponseEntity containing a list of all posts
     */
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    /**
     * Retrieves a specific post by ID
     * 
     * @param postId The ID of the post to retrieve
     * @return ResponseEntity containing the requested post or not found status
     */
    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPost(@PathVariable String postId) {
        try {
            Post post = postService.getPost(postId);
            return ResponseEntity.ok(post);
        } catch (PostException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Deletes a post by ID
     * 
     * @param postId The ID of the post to delete
     * @return ResponseEntity with success or not found status
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable String postId) {
        try {
            postService.deletePost(postId);
            return ResponseEntity.ok().build();
        } catch (PostException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Toggles like status for a post
     * 
     * @param postId The ID of the post to toggle like
     * @param userId The ID of the user toggling the like
     * @return ResponseEntity containing the updated total likes count
     */
    @PostMapping("/{postId}/toggle-like")
    public ResponseEntity<Integer> toggleLike(@PathVariable String postId, @RequestHeader("userId") String userId) {
        try {
            int totalLikes = postService.toggleLike(postId, userId);
            return ResponseEntity.ok(totalLikes);
        } catch (PostException e) {
            return ResponseEntity.badRequest().body(0);
        }
    }

    /**
     * Retrieves all comments for a specific post
     * 
     * @param postId The ID of the post to get comments for
     * @return ResponseEntity containing a list of comments
     * @throws PostException if the post is not found
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String postId) throws PostException {
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId));
    }
}
