package com.strong.familyauth.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familyauth.Model.User;
import com.strong.familyauth.Service.EmailService;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.UserException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    UserService userService;

    @Autowired
    EmailService emailService;

    @Transactional
    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> registerUser(@RequestBody User user) throws UserException {
        return new ResponseEntity<>(userService.signUp(user), HttpStatus.CREATED); // Setting OTP in BIO
    }

    @PostMapping("/sendSignupOtp")
    public String sendOtp(@RequestParam String email) throws UserException {
        emailService.sendOtpEmail(email);
        return "OTP sent successfully to " + email +". Please check your email.";
    }

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> login(@RequestBody User user)
            throws UserException {
        return ResponseEntity.ok(userService.authenticate(user.getEmail(), user.getPassword()));
    }

}
