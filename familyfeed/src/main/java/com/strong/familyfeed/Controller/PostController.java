package com.strong.familyfeed.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.strong.familyfeed.Model.Post;
import com.strong.familyfeed.Model.PostWithUser;
import com.strong.familyfeed.Service.PostService;
import com.strong.familyfeed.Service.StorageService;
import com.strong.familyfeed.Util.PostException;
import com.strong.familyfeed.Util.ResponseWrapper;

/**
 * REST Controller for handling feed-related operations in the FamilyGram
 * application.
 * This controller manages the creation, retrieval, deletion, and interaction
 * with feed,
 * including likes and comments.
 *
 * All endpoints require authentication (@PreAuthorize("isAuthenticated()")).
 *
 * @RestController Indicates that this class is a REST controller
 *                 @RequestMapping("/feeds") Base URL mapping for all
 *                 feed-related endpoints
 * 
 * @author [Your Name]
 * @version 1.0
 * @since [Date]
 *
 * @see PostService
 * @see Post
 * @see ResponseWrapper
 */
@RestController
@RequestMapping("/feeds")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private StorageService storageService;

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

    @GetMapping("/random-feed")
    public ResponseEntity<ResponseWrapper<List<PostWithUser>>> getRandomFeedPosts(
            @RequestParam String mineId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader("Authorization") String token) {

        List<PostWithUser> posts = postService.getPagedFeedPosts(mineId, page, size, token);

        return ResponseEntity.ok(new ResponseWrapper<>(
                HttpStatus.OK.value(),
                "Paged feed posts retrieved successfully",
                posts));
    }

}
