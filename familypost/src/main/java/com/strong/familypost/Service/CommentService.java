package com.strong.familypost.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
 * Service class for managing comment operations with Redis hash-based caching
 */
@Service
public class CommentService {

    @Autowired
    private CommentRepo commentRepo;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private String getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }

    public Comment createComment(Comment comment) throws PostException {
        String loggedId = getAuthenticatedUserId();
        if (!comment.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        Comment savedComment = commentRepo.save(comment);

        // ➕ Add comment to Redis hash
        String hashKey = "comments:" + comment.getPostId();
        redisTemplate.opsForHash().put(hashKey, savedComment.getId(), savedComment);

        return savedComment;
    }

    public List<Comment> getCommentsByPostId(String postId) throws PostException {
        String hashKey = "comments:" + postId;

        // 🧠 Try getting all comment values from Redis hash
        List<Object> cachedComments = redisTemplate.opsForHash().values(hashKey);
        if (!cachedComments.isEmpty()) {
            List<Comment> result = new ArrayList<>();
            for (Object obj : cachedComments) {
                result.add((Comment) obj);
            }
            return result;
        }

        // 💾 Fallback to DB if cache miss
        List<Comment> comments = commentRepo.findByPostId(postId);

        // 🧠 Cache each comment individually in Redis hash
        for (Comment comment : comments) {
            redisTemplate.opsForHash().put(hashKey, comment.getId(), comment);
        }

        return comments;
    }

    public Comment getCommentById(String id) throws PostException {
        return commentRepo.findById(id)
                .orElseThrow(() -> new PostException("Comment not found with id: " + id));
    }

    public Comment updateComment(String id, Comment commentDetails) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!commentDetails.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        Comment comment = commentRepo.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + id));

        comment.setText(commentDetails.getText());
        comment.setCreatedAt(LocalDateTime.now());

        Comment updatedComment = commentRepo.save(comment);

        // 🔄 Update comment in Redis hash
        String hashKey = "comments:" + comment.getPostId();
        redisTemplate.opsForHash().put(hashKey, updatedComment.getId(), updatedComment);

        return updatedComment;
    }

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

        // ❌ Remove comment from Redis hash
        String hashKey = "comments:" + comment.getPostId();
        redisTemplate.opsForHash().delete(hashKey, comment.getId());
    }
}
