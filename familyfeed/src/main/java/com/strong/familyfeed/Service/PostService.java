package com.strong.familyfeed.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.strong.familyfeed.Model.LiteUser;
import com.strong.familyfeed.Model.Post;
import com.strong.familyfeed.Model.PostWithUser;
import com.strong.familyfeed.Repository.PostRepo;
import com.strong.familyfeed.Util.ResponseWrapper;

/**
 * Service class responsible for managing Post-related operations.
 * This service provides methods for creating, retrieving, deleting, and
 * managing likes on Posts.
 *
 * @author FamilyGram
 * @version 1.0
 */

@Service
public class PostService {

    @Autowired
    private PostRepo PostRepo;

    @Autowired
    private UserServiceClient client;

    @SuppressWarnings("null")
    public List<PostWithUser> getRandomFeedPosts(String mineId, int userLimit, String token) {
        ResponseEntity<ResponseWrapper<List<LiteUser>>> response = client.getRandomFeedUsers(mineId, userLimit, token);

        if (response.getBody() == null || response.getBody().getData() == null) {
            return List.of();
        }

        List<LiteUser> users = response.getBody().getData();

        Pageable pageable = PageRequest.of(0, 2);

        return users.stream()
                .flatMap(user -> {
                    List<Post> Posts = PostRepo.findTopEngagedPostsByUserId(user.getId(), pageable);

                    return Posts.stream()
                            .filter(Post -> Post != null && Post.getUserId() != null)
                            .map(Post -> {
                                return new PostWithUser(
                                        user.getUsername(),
                                        user.getName(),
                                        user.getThumbnailId(),
                                        Post.getId(),
                                        Post.getUserId(),
                                        Post.getCaption(),
                                        Post.getMediaIds() != null ? Post.getMediaIds() : List.of(),
                                        Post.getLocation(),
                                        Post.getLikes() != null ? Post.getLikes() : new HashSet<>(),
                                        Post.getCreatedAt() != null ? Post.getCreatedAt() : LocalDateTime.now());
                            });
                })
                .collect(Collectors.toList());

    }

}
