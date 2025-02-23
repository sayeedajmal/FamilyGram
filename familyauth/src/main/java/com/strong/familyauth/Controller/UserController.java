package com.strong.familyauth.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strong.familyauth.Model.Profile;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.UserException;

@RequestMapping("/user")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Profile> getProfile(@RequestParam("username") String username) throws UserException {
        return new ResponseEntity<>(userService.getUserByUsername(username), HttpStatus.OK);
    }
}
