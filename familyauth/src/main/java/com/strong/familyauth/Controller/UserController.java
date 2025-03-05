package com.strong.familyauth.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.strong.familyauth.Model.Profile;
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
    public ResponseEntity<ResponseWrapper<Profile>> updateProfile(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("user") String userJson) throws UserException, JsonProcessingException {

        ObjectMapper objectMapper = new ObjectMapper();
        User updatedUser = objectMapper.readValue(userJson, User.class);
        Profile updatedProfile = userService.updateUser(file, updatedUser);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new ResponseWrapper<>(HttpStatus.ACCEPTED.value(), "Profile updated successfully",
                        updatedProfile));
    }

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Profile>> getProfile(@RequestParam("username") String username)
            throws UserException {
        Profile profile = userService.getUserByUsername(username);
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
    public ResponseEntity<ResponseWrapper<Profile>> getProfileByEmail(@RequestParam("email") String email)
            throws UserException {
        Profile profile = userService.getUserByEmail(email);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "User profile retrieved", profile));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseWrapper<Void>> logout(HttpServletRequest request) throws UserException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userService.revokeAccessToken(token);
            return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Logged out successfully", null));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ResponseWrapper<>(HttpStatus.UNAUTHORIZED.value(), "Invalid token", null));
    }
}
