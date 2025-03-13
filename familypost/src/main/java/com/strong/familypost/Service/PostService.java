package com.strong.familypost.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.strong.familypost.Model.Post;
import com.strong.familypost.Model.User;
import com.strong.familypost.Repository.CommentRepo;
import com.strong.familypost.Repository.PostRepo;
import com.strong.familypost.Util.PostException;

/**
 * Service class responsible for managing Post-related operations.
 * This service provides methods for creating, retrieving, deleting, and
 * managing likes on posts.
 *
 * @author FamilyGram
 * @version 1.0
 */

@Service
public class PostService {

    @Autowired
    private PostRepo postRepo;

    @Autowired
    private CommentRepo commentRepo;

    @Autowired
    private StorageService storageService;

    private String getAuthenticatedUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            User userDetails = (User) principal;
            // Return the username
            return userDetails.getId();
        }

        return null;
    }

    private boolean isPrivate() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            User userDetails = (User) principal;
            // Return the username
            return userDetails.isPrivate();
        }
        return false;
    }

    /**
     * Saves a new post to the repository.
     *
     * @param post The post object to be saved
     * @return The saved post object
     * @throws PostException If the post object is null
     */
    public Post savePost(MultipartFile file, Post post) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!post.getUserId().equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }

        try {
            // Step 1: Save post first to generate an ID
            Post savedPost = postRepo.save(post);

            // Ensure mediaIds is initialized
            if (savedPost.getMediaIds() == null) {
                savedPost.setMediaIds(new ArrayList<>());
            }

            if (file != null && !file.isEmpty()) {
                // Step 2: Upload media with the generated post ID
                String mediaId = storageService.uploadMedia(file, savedPost.getId());

                // Step 3: Add media ID to list and save post again
                savedPost.getMediaIds().add(mediaId);
                postRepo.save(savedPost);
            }

            return savedPost;
        } catch (Exception e) {
            throw new PostException("Error saving post: " + e.getMessage());
        }
    }

    /**
     * Deletes a post and all its associated comments from the database.
     * 
     * @param postId The unique identifier of the post to be deleted
     * @throws PostException        if the postId is null or empty, or if no post
     *                              exists with the given id
     * @throws TransactionException if there's a failure in the transaction during
     *                              deletion
     */
    @Transactional
    public void deletePost(String postId) throws PostException {
        String loggedId = getAuthenticatedUserId();

        if (!postId.equals(loggedId)) {
            throw new PostException("You are not authorized to access this Resource");
        }
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }
        if (!postRepo.existsById(postId)) {
            throw new PostException("Post not found with id: " + postId);
        }

        commentRepo.deleteByPostId(postId);

        postRepo.deleteById(postId);
    }

    /**
     * Retrieves a post by its ID.
     * 
     * @param postId The unique identifier of the post to retrieve
     * @return The Post object if found
     * @throws PostException if the postId is null or empty, or if no post exists
     *                       with the given id
     */
    public Post getPost(String postId) throws PostException {
        if (postId == null || postId.trim().isEmpty()) {
            throw new PostException("PostId cannot be null or empty");
        }
        return postRepo.findById(postId)
                .orElseThrow(() -> new PostException("Post not found with id: " + postId));
    }

    /**
     * Retrieves all posts from the database.
     * 
     * @return A List containing all Post objects
     */
    public List<Post> getAllPublicPosts() throws PostException {
        // Check if the current user is private
        if (isPrivate()) {
            // Throw exception if private users shouldn't access public posts
            throw new PostException("You are not authorized to access this Resource", HttpStatus.FORBIDDEN);
        }
        // Return all posts if user is not private
        return postRepo.findAll();
    }

    public List<Post> getAllPrivatePosts(String userId) throws PostException {
        // Get the currently authenticated user's ID
        String authenticatedUserId = getAuthenticatedUserId();

        // Check if the user is trying to access their own posts
        if (!userId.equals(authenticatedUserId)) {
            // Throw an exception if the user is trying to access someone else's posts
            throw new PostException("You are not authorized to access this Resource", HttpStatus.FORBIDDEN);
        }

        // Return posts for the authenticated user if authorized
        return postRepo.findByUserId(userId); // Assuming you have a method like this in the repository
    }

    /**
     * Toggles a like on a post for a specific user.
     * If the user has already liked the post, their like is removed.
     * If the user hasn't liked the post, a like is added.
     * 
     * @param postId The unique identifier of the post
     * @param id     The unique identifier of the user toggling the like
     * @return The updated number of likes on the post
     * @throws PostException if the post cannot be found or if there's an error
     *                       processing the like
     */
    public int toggleLike(String postId, String id) throws PostException {
        Post post = getPost(postId);
        Set<String> likes = post.getLikes();

        if (likes == null) {
            likes = new HashSet<>();
        }

        if (likes.contains(id)) {
            likes.remove(id);
        } else {
            likes.add(id);
        }

        post.setLikes(likes);
        postRepo.save(post);
        return likes.size();
    }

}
