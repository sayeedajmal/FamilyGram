package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.strong.familypost.Util.ResponseWrapper;

/**
 * REST Controller for handling comment-related operations in the FamilyGram
 * application.
 * REST Controller for handling comment-related operations in the FamilyGram
 * application.
 * This controller manages CRUD operations for comments.
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
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Comment>> createComment(@RequestBody Comment comment) throws PostException {
        System.out.println("HELLO: "+comment.toString());
        Comment createdComment = commentService.createComment(comment);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comment created successfully", createdComment));
    }

    /**
     * Retrieves all comments for a specific post.
     */
    @GetMapping("/post/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<Comment>>> getCommentsByPostId(@PathVariable String postId)
            throws PostException {
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comments retrieved successfully", comments));
    }

    /**
     * Retrieves a specific comment by its ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Comment>> getCommentById(@PathVariable String id) throws PostException {
        Comment comment = commentService.getCommentById(id);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comment retrieved successfully", comment));
    }

    /**
     * Updates an existing comment.
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Comment>> updateComment(@PathVariable String id,
            @RequestBody Comment commentDetails)
            throws PostException {
        Comment updatedComment = commentService.updateComment(id, commentDetails);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comment updated successfully", updatedComment));
    }

    /**
     * Deletes a comment by its ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Void>> deleteComment(@PathVariable String id) throws PostException {
        commentService.deleteComment(id);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Comment deleted successfully", null));
    }

}
