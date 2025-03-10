package com.strong.familypost.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.annotation.Transactional;

import com.strong.familypost.Model.Post;
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

    /**
     * Saves a new post to the repository.
     *
     * @param post The post object to be saved
     * @return The saved post object
     * @throws PostException If the post object is null
     */
    public Post savePost(Post post) throws PostException {
        if (post == null) {
            throw new PostException("Post cannot be null");
        }
        return postRepo.save(post);
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
    public List<Post> getAllPosts() {
        return postRepo.findAll();
    }

    /**
     * Toggles a like on a post for a specific user.
     * If the user has already liked the post, their like is removed.
     * If the user hasn't liked the post, a like is added.
     * 
     * @param postId The unique identifier of the post
     * @param userId The unique identifier of the user toggling the like
     * @return The updated number of likes on the post
     * @throws PostException if the post cannot be found or if there's an error
     *                       processing the like
     */
    public int toggleLike(String postId, String userId) throws PostException {
        Post post = getPost(postId);
        Set<String> likes = post.getLikes();

        if (likes == null) {
            likes = new HashSet<>();
        }

        if (likes.contains(userId)) {
            likes.remove(userId);
        } else {
            likes.add(userId);
        }

        post.setLikes(likes);
        postRepo.save(post);
        return likes.size();
    }

}
