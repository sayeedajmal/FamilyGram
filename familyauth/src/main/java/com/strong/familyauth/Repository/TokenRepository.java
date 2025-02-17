package com.strong.familyauth.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familyauth.Model.Token;

public interface TokenRepository extends MongoRepository<Token, String> {

    List<Token> findByUser(String username);

    Optional<Token> findByAccessToken(String accessToken);

    Optional<Token> findByRefreshToken(String refreshToken);

}