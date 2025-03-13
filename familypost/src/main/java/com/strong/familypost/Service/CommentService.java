package com.strong.familypost.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.User;
import com.strong.familypost.Repository.CommentRepo;
import com.strong.familypost.Util.PostException;

/**
 * Service class for managing comment operations
 */
@Service
public class CommentService {

    @Autowired
    CommentRepo commentRepo;

    private String getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            User userDetails = (User) principal;
            // Return the username
            return userDetails.getId();
        }

        return null;
    }

    /**
     * Creates a new comment
     * 
     * @param comment The comment to be created
     * @return The saved comment
     */
    public Comment createComment(Comment comment) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!comment.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }
        return commentRepo.save(comment);
    }

    /**
     * Retrieves all comments for a specific post
     * 
     * @param postId The ID of the post
     * @return List of comments for the specified post
     */
    public List<Comment> getCommentsByPostId(String postId) throws PostException {
        return commentRepo.findByPostId(postId);
    }

    /**
     * Retrieves a specific comment by its ID
     * 
     * @param id The ID of the comment
     * @return The found comment
     * @throws PostException if comment is not found
     */
    public Comment getCommentById(String id) throws PostException {
        return commentRepo.findById(id)
                .orElseThrow(() -> new PostException("Comment not found with id: " + id));
    }

    /**
     * Updates an existing comment
     * 
     * @param id             The ID of the comment to update
     * @param commentDetails The new comment details
     * @return The updated comment
     * @throws ResponseStatusException if comment is not found
     */
    public Comment updateComment(String id, Comment commentDetails) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!commentDetails.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }
        Comment comment = commentRepo.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + id));

        comment.setText(commentDetails.getText());
        comment.setCreatedAt(LocalDateTime.now()); // Update timestamp

        return commentRepo.save(comment);
    }

    /**
     * Deletes a comment by its ID
     * 
     * @param id The ID of the comment to delete
     * @throws PostException
     * @throws ResponseStatusException if comment is not found
     */
    public void deleteComment(String id) throws PostException {
        String loggedId = getAuthenticatedUserId();
        Comment comment = commentRepo.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + id));
        if (!comment.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }
        commentRepo.delete(comment);
    }
}
