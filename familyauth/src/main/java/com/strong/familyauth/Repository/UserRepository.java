package com.strong.familyauth.Repository;

import com.strong.familyauth.Model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByusername(String _username);
    Optional<User> findByEmail(String email);
}
