package com.strong.familyauth.Repository;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familyauth.Model.OtpEntity;

public interface OtpRepository extends MongoRepository<OtpEntity, String> {
    @Query("{ 'email' : ?0 }")
    Optional<OtpEntity> findByEmail(@Param("email") String email);
}
