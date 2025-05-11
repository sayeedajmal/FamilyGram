package com.strong.familypost.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.strong.familypost.Model.Comment;
import com.strong.familypost.Model.FullPost;
import com.strong.familypost.Model.Post;
import com.strong.familypost.Service.CommentService;
import com.strong.familypost.Service.LikeService;
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
    private StorageService storageService;

    @Autowired
    private LikeService likeService;

    /**
     * Creates a new post with multiple media attachments.
     *
     * @param files    List of multipart files to be attached to the post
     * @param postJson JSON string containing post data
     * @return ResponseEntity containing the created post
     * @throws PostException if there's an error processing the request
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<ResponseWrapper<Post>> createPost(
            @RequestPart(value = "files", required = true) List<MultipartFile> files,
            @RequestPart(value = "thumbnails", required = true) List<MultipartFile> thumbnails,
            @RequestParam("post") String postJson) throws PostException {

        if (files == null || files.isEmpty()) {
            throw new PostException("Choose at least one video or picture.");
        }

        if (thumbnails == null || thumbnails.isEmpty() || thumbnails.size() != files.size()) {
            throw new PostException("Each media file must have a corresponding thumbnail.");
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Post post = objectMapper.readValue(postJson, Post.class);

            // Save post with multiple media files and thumbnails
            Post savedPost = postService.savePost(files, thumbnails, post);

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
     * Retrieves all posts for a specific user.
     * 
     * @param id ID of the user whose private posts are to be retrieved
     * @return ResponseEntity containing list of private posts
     * @throws PostException if there's an error retrieving posts
     */
    @GetMapping()
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<Post>>> getAllPosts(@RequestParam("userId") String userId)
            throws PostException {
        List<Post> posts = postService.getUserPosts(userId);
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
    public ResponseEntity<ResponseWrapper<FullPost>> getPostById(
            @PathVariable String postId, @RequestParam String userId) {
        try {
            FullPost post = postService.getPostById(postId, userId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Post retrieved successfully", post));
        } catch (PostException e) {
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "No Post", null));
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
            return ResponseEntity.status(404).body(new ResponseWrapper<>(404, "No Post", null));
        }
    }

    /**
     * Toggles the like status of a post for a specific user.
     * 
     * @param postId ID of the post to toggle like
     * @param id     ID of the user toggling the like
     * @return ResponseEntity containing updated like count
     */
    @PostMapping("/{postId}/toggle-like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Boolean>> toggleLike(
            @PathVariable String postId,
            @RequestParam("userId") String userId) {
        try {
            boolean liked = likeService.toggleLike(postId, userId);
            return ResponseEntity.ok(new ResponseWrapper<>(200, "Like toggled successfully", liked));
        } catch (PostException e) {
            return ResponseEntity.badRequest().body(new ResponseWrapper<>(400, "Error toggling like", false));
        }
    }
}
