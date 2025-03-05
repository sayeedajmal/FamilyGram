package com.strong.familyauth.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familyauth.Model.ResponseWrapper;
import com.strong.familyauth.Model.User;
import com.strong.familyauth.Service.ImageStorageService;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.UserException;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    UserService userService;

    @Autowired
    private ImageStorageService imageStorageService;

    @PostMapping("/checkUsername")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResponseWrapper<Boolean>> checkUsernameAvailability(
            @RequestParam("username") String username) {
        boolean isAvailable = userService.isUsernameAvailable(username);
        String message = isAvailable ? "Username is available" : "Username is already taken";
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), message, isAvailable));
    }
    
    @Transactional
    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> registerUser(@RequestBody User user)
            throws UserException {
        Map<String, String> result = userService.signUp(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseWrapper<>(HttpStatus.CREATED.value(), "User registered successfully", result));
    }

    @PostMapping("/sendSignupOtp")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResponseWrapper<Void>> sendOtp(@RequestParam("email") String email) throws UserException {
        userService.sendEmailOtp(email);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "OTP sent successfully", null));
    }

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> login(@RequestBody User user) throws UserException {
        Map<String, String> result = userService.authenticate(user.getEmail(), user.getPassword());
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Login successful", result));
    }

    @PostMapping("/refresh")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> refreshToken(HttpServletRequest request)
            throws UserException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseWrapper<>(HttpStatus.UNAUTHORIZED.value(),
                            "Refresh token is missing or malformed",
                            null));
        }

        String refreshToken = authHeader.substring(7);
        Map<String, String> tokens = userService.refreshToken(refreshToken);
        return ResponseEntity.ok(new ResponseWrapper<>(HttpStatus.OK.value(), "Token refreshed successfully", tokens));
    }

    @GetMapping("/image/{fileId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<InputStreamResource> getImage(@PathVariable String fileId) throws UserException {
        InputStreamResource imageStream = imageStorageService.getImageStream(fileId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageStream);
    }
}
