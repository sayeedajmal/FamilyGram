package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.Post;
import com.strong.familypost.Service.CommentService;
import com.strong.familypost.Service.PostService;
import com.strong.familypost.Service.StorageService;
import com.strong.familypost.Util.PostException;
import com.strong.familypost.Util.ResponseWrapper;

/**
 * REST Controller for handling post-related operations in the FamilyGram
 * application.
 * This controller manages the creation, retrieval, deletion, and interaction
 * with posts,
 * including likes and comments.
 *
 * All endpoints require authentication (@PreAuthorize("isAuthenticated()")).
 *
 * @RestController Indicates that this class is a REST controller
 *                 @RequestMapping("/posts") Base URL mapping for all
 *                 post-related endpoints
 * 
 * @author [Your Name]
 * @version 1.0
 * @since [Date]
 *
 * @see PostService
 * @see CommentService
 * @see Post
 * @see Comment
 * @see ResponseWrapper
 */
@RestController
@RequestMapping("/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private StorageService storageService;

    /**
     * Creates a new post with optional file attachment.
     * 
     * @param file     Optional multipart file to be attached to the post
     * @param postJson JSON string containing post data
     * @return ResponseEntity containing the created post
     * @throws PostException if there's an error processing the request
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
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

    @GetMapping("/media/{fileId}")
    public ResponseEntity<InputStreamResource> getMediaStream(@PathVariable String fileId) throws PostException {
        GridFSFile file = storageService.getFileMetadata(fileId);
        if (file == null || file.getMetadata() == null) {
            throw new PostException("File not found");
        }

        String contentType = file.getMetadata().getString("type");
        InputStreamResource mediaStream = storageService.getMediaStream(fileId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(mediaStream);
    }

    /**
     * Retrieves all public posts.
     * 
     * @return ResponseEntity containing list of public posts
     * @throws PostException if there's an error retrieving posts
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<Post>>> getAllPosts() throws PostException {
        List<Post> posts = postService.getAllPublicPosts();
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Posts retrieved successfully", posts));
    }

    /**
     * Retrieves all private posts for a specific user.
     * 
     * @param userId ID of the user whose private posts are to be retrieved
     * @return ResponseEntity containing list of private posts
     * @throws PostException if there's an error retrieving posts
     */
    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<Post>>> getPrivateAllPosts(@RequestParam("userId") String userId)
            throws PostException {
        List<Post> posts = postService.getAllPrivatePosts(userId);
        return ResponseEntity.ok(new ResponseWrapper<>(200, "Posts retrieved successfully", posts));
    }

    /**
     * Retrieves a specific post by its ID.
     * 
     * @param postId ID of the post to retrieve
     * @return ResponseEntity containing the requested post
     */
    @GetMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Post>> getPost(@PathVariable String postId) {
        try {
            Post post = postService.getPost(postId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post retrieved successfully", post));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "Post not found", null));
        }
    }

    /**
     * Deletes a specific post by its ID.
     * Only the owner of the post can delete it.
     * 
     * @param postId ID of the post to delete
     * @return ResponseEntity with deletion status
     */
    @DeleteMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Void>> deletePost(@PathVariable String postId) {
        try {
            postService.deletePost(postId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post deleted successfully", null));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "Post not found", null));
        }
    }

    /**
     * Toggles the like status of a post for a specific user.
     * 
     * @param postId ID of the post to toggle like
     * @param userId ID of the user toggling the like
     * @return ResponseEntity containing updated like count
     */
    @PostMapping("/{postId}/toggle-like")
    @PreAuthorize("isAuthenticated()")
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
     * Retrieves all comments for a specific post.
     * 
     * @param postId ID of the post to retrieve comments for
     * @return ResponseEntity containing list of comments
     */
    @GetMapping("/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<Comment>>> getComments(@PathVariable String postId) {
        try {
            List<Comment> comments = commentService.getCommentsByPostId(postId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Comments retrieved successfully", comments));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "Comments not found", null));
        }
    }
}
