package com.strong.familyauth.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.strong.familyauth.Model.User;
import com.strong.familyauth.Repository.UserRepository;
import com.strong.familyauth.Service.ImageStorageService;
import com.strong.familyauth.Util.UserException;

@RestController
@RequestMapping("/profile/update")
public class updateController {

    @Autowired
    ImageStorageService imageStorageService;

    @Autowired
    UserRepository userRepo;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    User user;

    

    public ResponseEntity<String> update(@RequestParam("file") MultipartFile file) throws UserException {
        String uploadImage = imageStorageService.uploadImage(file);
        user.setPhotoUrl(uploadImage);
        userRepo.save(user);
        return ResponseEntity.ok("Image uploaded successfully");
    }

    @PostMapping("/updateName")
    public ResponseEntity<String> update(@RequestParam("name") String name) {
        user.setName(name);
        userRepo.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    @PostMapping("/updateEmail")
    public ResponseEntity<String> updateEmail(@RequestParam("email") String email) {
        user.setEmail(email);
        userRepo.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    @PostMapping("/updatePassword")
    public ResponseEntity<String> updatePassword(@RequestParam("password") String password) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    @PostMapping("/updatePhone")
    public ResponseEntity<String> updatePhone(@RequestParam("phone") String phone) {
        user.setPhone(phone);
        userRepo.save(user);
        return ResponseEntity.ok("User updated successfully");
    }

    @PostMapping("/updateBio")
    public ResponseEntity<String> updateBio(@RequestParam("bio") String bio) {
        user.setBio(bio);
        userRepo.save(user);
        return ResponseEntity.ok("User updated successfully");
    }
}
