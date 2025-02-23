package com.strong.familyauth.Repository;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import com.strong.familyauth.Model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    @Query("{ 'username' : ?0 }")
    Optional<User> findByusername(@Param("username") String username);
    @Query("{ 'email' : ?0 }")
    Optional<User> findByEmail(@Param("email") String email);
}
