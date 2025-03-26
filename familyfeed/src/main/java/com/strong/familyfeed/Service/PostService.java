package com.strong.familyfeed.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
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
    private PostRepo postRepo;

    @Autowired
    private UserServiceClient client;

    @SuppressWarnings("null")
    public List<PostWithUser> getRandomFeedPosts(String mineId, int userLimit, String token) {
        ResponseEntity<ResponseWrapper<List<LiteUser>>> response = client.getRandomFeedUsers(mineId, userLimit, token);

        if (response.getBody() == null || response.getBody().getData() == null) {
            return List.of();
        }

        List<LiteUser> users = response.getBody().getData();

        Pageable pageable = PageRequest.of(0, 5);

        return users.stream()
                .flatMap(user -> {
                    List<Post> posts = postRepo.findTopEngagedPostsByUserId(user.getId(), pageable);
                    return posts.stream()
                            .filter(post -> post != null && post.getUserId() != null)
                            .map(post -> new PostWithUser(
                                    user.getUsername(),
                                    user.getName(),
                                    user.getThumbnailId(),
                                    post.getId(),
                                    post.getUserId(),
                                    post.getCaption(),
                                    post.getMediaIds() != null ? post.getMediaIds() : List.of(),
                                    post.getLocation(),
                                    post.getLikes() != null ? post.getLikes() : new HashSet<>(),
                                    post.getCreatedAt() != null ? post.getCreatedAt() : LocalDateTime.now()));
                })
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(() -> new LinkedHashSet<>()), // 🔥 Removes duplicates
                        list -> {
                            List<PostWithUser> finalList = new ArrayList<>(list);
                            Collections.shuffle(finalList); // 🔀 Shuffle to randomize the feed
                            return finalList;
                        }));

    }

}
