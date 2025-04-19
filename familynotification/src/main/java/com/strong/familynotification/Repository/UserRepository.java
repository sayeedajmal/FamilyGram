package com.strong.familynotification.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familynotification.Model.User;

public interface UserRepository extends MongoRepository<User, String> {
}
