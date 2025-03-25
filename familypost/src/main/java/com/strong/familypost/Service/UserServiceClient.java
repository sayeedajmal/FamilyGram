package com.strong.familypost.Service;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import com.strong.familypost.Model.LiteUser;
import com.strong.familypost.Util.ResponseWrapper;

//https://familygram.onrender.com
@FeignClient(name = "user-service", url = "http://localhost:8082")
@Service
public interface UserServiceClient {

    @GetMapping("/user/privacy")
    ResponseEntity<String> getUserPrivacy(
            @RequestParam("mineId") String mineId,
            @RequestParam("yourId") String yourId,
            @RequestHeader("Authorization") String token);

    @GetMapping("/user/random-feed-users")
    ResponseEntity<ResponseWrapper<List<LiteUser>>> getRandomFeedUsers(
            @RequestParam("mineId") String mineId,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestHeader("Authorization") String token);

}
