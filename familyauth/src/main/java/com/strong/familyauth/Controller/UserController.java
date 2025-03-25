package com.strong.familyauth.Controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.strong.familyauth.Model.LiteUser;
import com.strong.familyauth.Model.ResponseWrapper;
import com.strong.familyauth.Model.User;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.UserException;

import jakarta.servlet.http.HttpServletRequest;

@RequestMapping("/user")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<User>> updateProfile(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("user") String userJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail)
            throws UserException, JsonProcessingException {

        ObjectMapper objectMapper = new ObjectMapper();
        User updatedUser = objectMapper.readValue(userJson, User.class);
        User updatedProfile = userService.updateUser(file, updatedUser, thumbnail);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new ResponseWrapper<>(HttpStatus.ACCEPTED.value(), "User updated successfully",
                        updatedProfile));
    }

    @GetMapping("/privacy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> privacy(@RequestParam String mineId, @RequestParam String yourId) {
        boolean canAccessProfile = userService.canAccessProfile(mineId, yourId);

        if (canAccessProfile) {
            return ResponseEntity.ok("Access granted");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Account is Private");
        }
    }

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<User>> getProfile(@RequestParam("mineId") String mineId,
            @RequestParam("username") String username)
            throws UserException {
        User profile = userService.getUserByUsername(mineId, username);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profile retrieved", profile));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<?>> searchByUsername(
            @RequestParam("username") String username) {

        // Fetch matching users from the userService
        List<Map<String, Object>> users = userService.searchByUserName(username);

        // If no users are found, return a 404 response
        if (users == null || users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseWrapper<>(HttpStatus.NOT_FOUND.value(), "No users found", null));
        }

        // Return a list of users wrapped in the response
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profiles retrieved", users));
    }

    @GetMapping("/random-feed-users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<List<LiteUser>>> getRandomFeedUsers(
            @RequestParam String mineId,
            @RequestParam(defaultValue = "10") int limit) {
        List<LiteUser> users = userService.findRandomFeedUsers(mineId, limit);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Random feed users retrieved", users));
    }

    @GetMapping("/{userId}/lite")
    public ResponseEntity<ResponseWrapper<LiteUser>> getLiteUserById(@PathVariable String userId) {
        return userService.findLiteUserById(userId)
                .map(user -> ResponseEntity
                        .ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profile retrieved", user)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseWrapper<>(HttpStatus.NOT_FOUND.value(), "User not found", null)));
    }

    @PostMapping("/byId")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<User>> getProfileByID(@RequestParam("mineId") String mineId,
            @RequestParam("userId") String userId)
            throws UserException {
        User profile = userService.getUserByUserId(mineId, userId);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profile retrieved", profile));
    }

    @PostMapping("/updateEmail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<String>> updateEmail(@RequestParam("id") String id,
            @RequestParam("email") String email) throws UserException {
        String result = userService.updateUserEmail(id, email);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Email updated successfully", result));
    }

    @PostMapping("/updatePhone")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<String>> updatePhone(@RequestParam("id") String id,
            @RequestParam("phone") String phone) throws UserException {
        String result = userService.updateUserPhone(id, phone);
        return ResponseEntity
                .ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Phone number updated successfully", result));
    }

    @PostMapping("/email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<User>> getProfileByEmail(@RequestParam("email") String email)
            throws UserException {
        User profile = userService.getUserByEmail(email);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profile retrieved", profile));
    }

    /**
     * Get followers of a user.
     *
     * @param yourId ID of the user whose followers are being retrieved
     * @param mineId Authenticated user ID (retrieved from JWT)
     * @return Set of user IDs who follow the given user
     */
    @GetMapping("/followers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Set<String>> getFollowers(@RequestParam String yourId, @RequestParam String mineId,
            @RequestHeader("Authorization") String token) {
        Set<String> followers = userService.getFollowers(mineId, yourId);
        return ResponseEntity.ok(followers);
    }

    /**
     * @param mineId   ID of the authenticated user (the one performing the
     *                 follow/unfollow action)
     * @param yourId   ID of the user to be followed or unfollowed
     * @param imageUrl The image URL used for follow request emails (if applicable)
     * @return A ResponseEntity containing a ResponseWrapper with the result message
     *         and the updated user data (including following/followers lists)
     * @throws UserException if either of the users cannot be found or any other
     *                       user-related error occurs
     */
    @PostMapping("/toggleFollow")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<String>> toggleFollow(@RequestParam("mineId") String mineId,
            @RequestParam("yourId") String yourId,
            @RequestParam("imageUrl") String imageUrl)
            throws UserException {

        String toggleFollowerMessage = userService.toggleFollower(mineId, yourId, imageUrl);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), toggleFollowerMessage, ""));
    }

    /**
     * Get followings of a user.
     *
     * @param yourId ID of the user whose followings are being retrieved
     * @param mineId Authenticated user ID (retrieved from JWT)
     * @return Set of user IDs whom the given user follows
     */
    @GetMapping("/followings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Set<String>> getFollowings(@RequestParam String yourId, @RequestParam String mineId,
            @RequestHeader("Authorization") String token) {
        Set<String> followings = userService.getFollowings(mineId, yourId);
        return ResponseEntity.ok(followings);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Void>> logout(HttpServletRequest request) throws UserException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userService.logout(token);
            return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Logged out successfully", null));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ResponseWrapper<>(HttpStatus.UNAUTHORIZED.value(), "Invalid token", null));
    }
}
