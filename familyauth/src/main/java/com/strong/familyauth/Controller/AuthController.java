package com.strong.familyauth.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familyauth.Model.User;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.UserException;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    UserService userService;

    @Transactional
    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody User user) throws UserException {
        return new ResponseEntity<>(userService.signUp(user), HttpStatus.CREATED);
    }

    @PostMapping("/sendSignupOtp")
    @PreAuthorize("permitAll()")
    public String sendOtp(@RequestParam("email") String email) throws UserException {
        userService.sendEmailOtp(email);
        return "OTP sent successfully to " + email + ". Please check your email.";
    }

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> login(@RequestBody User user) throws UserException {
        return ResponseEntity.ok(userService.authenticate(user.getEmail(), user.getPassword()));
    }

    @GetMapping("/refresh")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token is missing or malformed");
        }

        String refreshToken = authHeader.substring(7);

        try {
            Map<String, String> tokens = userService.refreshToken(refreshToken);
            return ResponseEntity.ok(tokens);
        } catch (UserException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

}
