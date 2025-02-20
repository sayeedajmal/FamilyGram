package com.strong.familyauth.Repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familyauth.Model.OtpEntity;

public interface OtpRepository extends MongoRepository<OtpEntity, String> {
    Optional<OtpEntity> findByEmail(String email);
}
