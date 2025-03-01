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
    public ResponseEntity<Profile> updateProfile(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("user") String userJson) throws UserException, JsonProcessingException {

        ObjectMapper objectMapper = new ObjectMapper();
        User updatedUser = objectMapper.readValue(userJson, User.class);

        return new ResponseEntity<>(userService.updateUser(file, updatedUser), HttpStatus.ACCEPTED);
    }


    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Profile> getProfile(@RequestParam("username") String username) throws UserException {
        return new ResponseEntity<>(userService.getUserByUsername(username), HttpStatus.OK);
    }

    @PostMapping("/updateEmail")
    @PreAuthorize("isAuthenticated() and #updatedUser.username == authentication.name")
    public ResponseEntity<String> updateEmail(@RequestParam("id") String id, @RequestParam("email") String email)
            throws UserException {
        return new ResponseEntity<>(userService.updateUserEmail(id, email), HttpStatus.OK);
    }

    @PostMapping("/updatePhone")
    @PreAuthorize("isAuthenticated() and #updatedUser.username == authentication.name")
    public ResponseEntity<String> updatePhone(@RequestParam("id") String id, @RequestParam("phone") String phone)
            throws UserException {
        return new ResponseEntity<>(userService.updateUserPhone(id, phone), HttpStatus.OK);
    }

    @PostMapping("/email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Profile> getProfileByEmail(@RequestParam("email") String email) throws UserException {
        return new ResponseEntity<>(userService.getUserByEmail(email), HttpStatus.OK);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> logout(HttpServletRequest request) throws UserException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userService.revokeAccessToken(token);
            return ResponseEntity.ok("Logged out successfully");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
    }
}
