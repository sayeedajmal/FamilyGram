package com.strong.familyfeed.Service;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import com.strong.familyfeed.Model.LiteUser;
import com.strong.familyfeed.Util.ResponseWrapper;

@FeignClient(name = "familyauth", url="${feign.client-url}")
@Service
public interface UserServiceClient {

        @GetMapping("/user/random-feed-users")
        ResponseEntity<ResponseWrapper<List<LiteUser>>> getRandomFeedUsers(
                        @RequestParam("mineId") String mineId,
                        @RequestParam(value = "limit", defaultValue = "10") int limit,
                        @RequestHeader("Authorization") String token);

}
