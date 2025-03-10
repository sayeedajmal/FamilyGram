package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familypost.Model.Comment;
import com.strong.familypost.Service.CommentService;
import com.strong.familypost.Util.PostException;

/**
 * REST Controller for handling comment-related operations in the FamilyGram
 * application.
 * This controller manages CRUD operations for comment, including creating,
 * retrieving,
 * deleting posts, and handling comment-related actions such as likes and
 * comments.
 * 
 * @author FamilyGram
 * @version 1.0
 */
@RestController
@RequestMapping("/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    /**
     * Creates a new comment.
     *
     * @param comment The comment object to be created
     * @return ResponseEntity containing the created comment
     * @throws PostException if comment creation fails
     */
    @PostMapping
    public ResponseEntity<Comment> createComment(@RequestBody Comment comment) throws PostException {
        // Process the incoming comment and create it in the system
        Comment createdComment = commentService.createComment(comment);
        return ResponseEntity.ok(createdComment);
    }

    /**
     * Retrieves all comments in the system.
     *
     * @return ResponseEntity containing a list of all comments
     * @throws PostException if retrieval fails
     */
    @GetMapping
    public ResponseEntity<List<Comment>> getAllComments() throws PostException {
        // Fetch all comments from the service
        List<Comment> comments = commentService.getAllComments();
        return ResponseEntity.ok(comments);
    }

    /**
     * Retrieves all comments for a specific post.
     *
     * @param postId The ID of the post to get comments for
     * @return ResponseEntity containing a list of comments for the specified post
     * @throws PostException if retrieval fails
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Comment>> getCommentsByPostId(@PathVariable String postId) throws PostException {
        // Fetch comments associated with the specified post ID
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }

    /**
     * Retrieves a specific comment by its ID.
     *
     * @param id The ID of the comment to retrieve
     * @return ResponseEntity containing the requested comment
     * @throws PostException if comment not found or retrieval fails
     */
    @GetMapping("/{id}")
    public ResponseEntity<Comment> getCommentById(@PathVariable String id) throws PostException {
        // Fetch the specific comment by its ID
        Comment comment = commentService.getCommentById(id);
        return ResponseEntity.ok(comment);
    }

    /**
     * Updates an existing comment.
     *
     * @param id             The ID of the comment to update
     * @param commentDetails The updated comment details
     * @return ResponseEntity containing the updated comment
     * @throws PostException if comment not found or update fails
     */
    @PutMapping("/{id}")
    public ResponseEntity<Comment> updateComment(@PathVariable String id, @RequestBody Comment commentDetails)
            throws PostException {
        // Update the existing comment with new details
        Comment updatedComment = commentService.updateComment(id, commentDetails);
        return ResponseEntity.ok(updatedComment);
    }

    /**
     * Deletes a comment by its ID.
     *
     * @param id The ID of the comment to delete
     * @return ResponseEntity containing success message
     * @throws PostException if comment not found or deletion fails
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(@PathVariable String id) throws PostException {
        // Remove the comment from the system
        commentService.deleteComment(id);
        return ResponseEntity.ok("Comment deleted successfully");
    }

    /**
     * Counts the total number of comments in the system.
     *
     * @return ResponseEntity containing the total count of comments
     * @throws PostException if counting operation fails
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countAllComments() throws PostException {
        // Get the total count of comments
        long count = commentService.getAllComments().size();
        return ResponseEntity.ok(count);
    }
}
