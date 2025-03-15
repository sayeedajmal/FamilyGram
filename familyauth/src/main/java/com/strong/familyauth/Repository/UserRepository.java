package com.strong.familyauth.Repository;

import java.util.Optional;
import java.util.Set;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;

import com.strong.familyauth.Model.User;

public interface UserRepository extends MongoRepository<User, String> {

    @Query("{ 'username' : ?0 }")
    Optional<User> findByusername(@Param("username") String username);

    @Query("{ 'email' : ?0 }")
    Optional<User> findByEmail(@Param("email") String email);

    @Query(value = "{ 'id' : ?0 }", fields = "{ 'followers' : 1 }")
    Optional<Set<String>> getFollowersById(@Param("id") String id);

    @Query(value = "{ 'id' : ?0 }", fields = "{ 'following' : 1 }")
    Optional<Set<String>> getFollowingById(@Param("id") String id);
}
