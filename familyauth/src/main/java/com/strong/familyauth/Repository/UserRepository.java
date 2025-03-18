package com.strong.familyauth.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;

import com.strong.familyauth.Model.User;

public interface UserRepository extends MongoRepository<User, String> {

    // Find user by exact username
    @Query("{ 'username' : ?0 }")
    Optional<User> findByUsername(@Param("username") String username);

    // Find user by exact email
    @Query("{ 'email' : ?0 }")
    Optional<User> findByEmail(@Param("email") String email);

    // Get followers by user ID
    @Query(value = "{ 'id' : ?0 }", fields = "{ 'followers' : 1 }")
    Optional<Set<String>> getFollowersById(@Param("id") String id);

    // Get following by user ID
    @Query(value = "{ 'id' : ?0 }", fields = "{ 'following' : 1 }")
    Optional<Set<String>> getFollowingById(@Param("id") String id);

    @Query("{ 'username' : { $regex: ?0, $options: 'i' } }")
    List<User> findByUsernameContaining(@Param("username") String username);
}
