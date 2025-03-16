package com.strong.familypost.Service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@FeignClient(name = "user-service", url = "https://familygram.onrender.com")
@Service
public interface UserServiceClient {

    @GetMapping("/user/privacy")
    ResponseEntity<String> getUserPrivacy(
            @RequestParam("mineId") String mineId,
            @RequestParam("yourId") String yourId,
            @RequestHeader("Authorization") String token);
}
