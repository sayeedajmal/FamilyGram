package com.strong.familypost.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.User;
import com.strong.familypost.Repository.CommentRepo;
import com.strong.familypost.Util.PostException;

/**
 * Service class for managing comment operations with Redis caching
 */
@Service
public class CommentService {

    @Autowired
    private CommentRepo commentRepo;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * Get authenticated user ID
     */
    private String getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }

    /**
     * Creates a new comment and updates cache
     */
    public Comment createComment(Comment comment) throws PostException {
        String loggedId = getAuthenticatedUserId();
        if (!comment.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        Comment savedComment = commentRepo.save(comment);

        updateCachedComments(comment.getPostId());

        return savedComment;
    }

    /**
     * Retrieves all comments for a specific post (Uses Redis Cache)
     */
    @SuppressWarnings("unchecked")
    public List<Comment> getCommentsByPostId(String postId) throws PostException {
        String cacheKey = "comments:" + postId;

        // 1️⃣ Try fetching from Redis first
        Object cachedData = redisTemplate.opsForValue().get(cacheKey);
        if (cachedData instanceof List<?>) {
            return (List<Comment>) cachedData; // Return cached comments
        }

        // 2️⃣ If cache is empty, fetch from DB and store in cache
        List<Comment> comments = commentRepo.findByPostId(postId);
        redisTemplate.opsForValue().set(cacheKey, comments, Duration.ofMinutes(20));

        return comments;
    }

    /**
     * Retrieves a specific comment by its ID
     */
    public Comment getCommentById(String id) throws PostException {
        return commentRepo.findById(id)
                .orElseThrow(() -> new PostException("Comment not found with id: " + id));
    }

    /**
     * Updates an existing comment and refreshes cache
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

        Comment updatedComment = commentRepo.save(comment);

        updateCachedComments(comment.getPostId());

        return updatedComment;
    }

    /**
     * Deletes a comment and updates cache
     */
    public void deleteComment(String id) throws PostException {
        String loggedId = getAuthenticatedUserId();
        Optional<Comment> optionalComment = commentRepo.findById(id);

        if (!optionalComment.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + id);
        }

        Comment comment = optionalComment.get();

        if (!comment.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        commentRepo.delete(comment);

        updateCachedComments(comment.getPostId());
    }

    /**
     * Utility method to refresh cached comments for a given post
     */
    private void updateCachedComments(String postId) {
        String cacheKey = "comments:" + postId;

        // Fetch latest comments from DB
        List<Comment> updatedComments = commentRepo.findByPostId(postId);

        // Update cache with fresh data
        redisTemplate.opsForValue().set(cacheKey, updatedComments, Duration.ofMinutes(20));
    }
}
