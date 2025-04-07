package com.strong.familyauth.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperationContext;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.strong.familyauth.Model.LiteUser;
import com.strong.familyauth.Model.Token;
import com.strong.familyauth.Model.User;
import com.strong.familyauth.Repository.TokenRepository;
import com.strong.familyauth.Repository.UserRepository;
import com.strong.familyauth.Util.JwtUtil;
import com.strong.familyauth.Util.KafkaProducer;
import com.strong.familyauth.Util.UserException;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    ImageStorageService imageStorageService;

    @Autowired
    User savedUser;

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private KafkaProducer kafkaProducer;
    @Autowired
    private RedisTemplate<String, User> redisTemplate;

    public boolean canAccessProfile(String mineId, String yourId) {
        String redisKey = "user:" + yourId;
        User user = redisTemplate.opsForValue().get(redisKey);

        if (user == null) {
            Optional<User> userOptional = userRepo.findById(yourId);

            if (userOptional.isEmpty()) {
                return false; // user doesn't exist
            }

            user = userOptional.get();
            redisTemplate.opsForValue().set(redisKey, user); // cache it
        }

        // If public profile, allow access
        if (!user.isPrivacy()) {
            return true;
        }

        // If private, allow only if requester is a follower
        return user.getFollowers().contains(mineId);
    }

    public String sendEmailOtp(String email) throws UserException {
        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new UserException("Email already in use: " + email);
        }
        emailService.sendOtpEmail(email);
        return "Email sent successfully! Validity is 3 Minutes.";
    }

    public Map<String, Object> signUp(User user) throws UserException {
        if (!emailService.validateOtp(user.getEmail(), user.getBio())) {
            throw new UserException("Incorrect OTP/Expired OTP. Please try again.");
        }

        if (!isUsernameAvailable(user.getUsername())) {
            throw new UserException("Check Your Username");
        }

        user.setBio("");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setEnabled(true);
        user.setPhone("");
        user.setPhotoId("");
        user.setPrivacy(false);
        user.setCredentialsNonExpired(true);
        user.setFollowers(new HashSet<>());
        user.setFollowing(new HashSet<>());
        user.setWebsite("");

        String refreshToken = jwtUtil.generateRefreshToken(user);
        User save = userRepo.save(user);
        save.setPassword(null);
        String accessToken = jwtUtil.generateAccessToken(save);
        redisTemplate.opsForValue().set("user:" + save.getId(), save);
        saveToken(accessToken, refreshToken, save);
        Map<String, Object> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        tokens.put("myProfile", save);

        return tokens;
    }

    public String removeFollow(String mineId, String yourId) throws UserException {
        String yourKey = "user:" + yourId;

        // Try Redis
        User yourUser = redisTemplate.opsForValue().get(yourKey);

        // Fallback to DB
        if (yourUser == null) {
            yourUser = userRepo.findById(yourId).orElse(null);
            if (yourUser != null)
                redisTemplate.opsForValue().set(yourKey, yourUser);
        }

        if (yourUser == null) {
            return "User not found.";
        }

        // Check and remove follow request
        if (yourUser.getFollowRequests().contains(mineId)) {
            yourUser.getFollowRequests().remove(mineId);

            // 🔥 Correct Kafka payload — send updated list
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", yourId);
            payload.put("followRequests", yourUser.getFollowRequests());
            kafkaProducer.sendToKafka(payload, "UPDATE");

            // Save + Update Redis
            userRepo.save(yourUser);
            redisTemplate.opsForValue().set(yourKey, yourUser);

            return "Follow request rejected.";
        }

        return "No follow request from this user.";
    }

    public boolean acceptFollowRequest(String mineId, String userId) throws UserException {
        String mineKey = "user:" + mineId;
        String userKey = "user:" + userId;

        User mineUser = redisTemplate.opsForValue().get(mineKey);
        User user = redisTemplate.opsForValue().get(userKey);

        // Fallback to DB if not in Redis
        if (mineUser == null) {
            mineUser = userRepo.findById(mineId).orElse(null);
            if (mineUser != null)
                redisTemplate.opsForValue().set(mineKey, mineUser);
        }

        if (user == null) {
            user = userRepo.findById(userId).orElse(null);
            if (user != null)
                redisTemplate.opsForValue().set(userKey, user);
        }

        // Validate and process the follow request
        if (mineUser != null && user != null) {
            if (mineUser.getFollowRequests().contains(userId)) {

                // Remove request
                mineUser.getFollowRequests().remove(userId);

                // Add to followers/following
                // Update 1: mineUser (id = mineId, followers = id)
                Map<String, Object> minePayload = new HashMap<>();
                minePayload.put("id", mineId);
                minePayload.put("followers", userId);
                kafkaProducer.sendToKafka(minePayload, "UPDATE");

                // Update 2: user (userId = userId, followingAdded = mineId)
                Map<String, Object> userPayload = new HashMap<>();
                userPayload.put("id", userId);
                userPayload.put("following", mineId);
                kafkaProducer.sendToKafka(userPayload, "UPDATE");

                // Update Redis again after saving
                redisTemplate.opsForValue().set(mineKey, mineUser);
                redisTemplate.opsForValue().set(userKey, user);

                return true;
            }
        }

        return false;
    }

    public String toggleFollower(String mineId, String yourId, String imageUrl) throws UserException {
        String mineKey = "user:" + mineId;
        String yourKey = "user:" + yourId;

        // Fetch mine user from Redis or DB
        User mine = redisTemplate.opsForValue().get(mineKey);
        if (mine == null) {
            mine = userRepo.findById(mineId).orElseThrow(() -> new UserException("User not found: " + mineId));
        }

        // Fetch your user from Redis or DB
        User your = redisTemplate.opsForValue().get(yourKey);
        if (your == null) {
            your = userRepo.findById(yourId).orElseThrow(() -> new UserException("User not found: " + yourId));
        }

        // 🔒 Handle private account
        if (your.isPrivacy()) {
            if (your.getFollowRequests() == null) {
                your.setFollowRequests(new HashSet<>());
            }

            boolean alreadyRequested = your.getFollowRequests().contains(mineId);

            if (alreadyRequested) {
                your.getFollowRequests().remove(mineId);
            } else {
                emailService.sendFollowRequestEmail(your.getEmail(), mine.getEmail(), imageUrl);
                your.getFollowRequests().add(mineId);
            }

            // Update Redis cache
            redisTemplate.opsForValue().set(yourKey, your);

            // 🔥 Kafka payload
            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("id", yourId);
            requestPayload.put("followRequests", new ArrayList<>(your.getFollowRequests()));
            kafkaProducer.sendToKafka(requestPayload, "UPDATE");

            return alreadyRequested
                    ? "Follow request removed."
                    : "Follow request sent successfully.";
        }

        // 🟢 Public follow/unfollow
        boolean isAlreadyFollowing = mine.getFollowing().contains(yourId);

        if (isAlreadyFollowing) {
            mine.getFollowing().remove(yourId);
            your.getFollowers().remove(mineId);
        } else {
            mine.getFollowing().add(yourId);
            your.getFollowers().add(mineId);
        }

        // Update Redis cache
        redisTemplate.opsForValue().set(mineKey, mine);
        redisTemplate.opsForValue().set(yourKey, your);

        // 🔥 Kafka payloads with only actual fields in User
        Map<String, Object> minePayload = new HashMap<>();
        minePayload.put("id", mineId);
        minePayload.put("following", new ArrayList<>(mine.getFollowing()));

        Map<String, Object> yourPayload = new HashMap<>();
        yourPayload.put("id", yourId);
        yourPayload.put("followers", new ArrayList<>(your.getFollowers()));

        kafkaProducer.sendToKafka(minePayload, "FOLLOW");
        kafkaProducer.sendToKafka(yourPayload, "FOLLOW");

        return isAlreadyFollowing ? "Unfollowed successfully." : "Followed successfully.";
    }

    public Map<String, Object> authenticate(String email, String password) throws UserException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));

        if (!user.isAccountNonExpired()) {
            throw new UserException("Your account has expired. Visit the Offical Support", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isAccountNonLocked()) {
            throw new UserException("Your account is locked. Visit the Offical Support", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isEnabled()) {
            throw new UserException("Your account is disabled. Visit the Offical Support", HttpStatus.UNAUTHORIZED);
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    email,
                    password));
        } catch (AuthenticationException e) {
            throw new UserException(e.getMessage());
        }
        revokeAllTokens(user);
        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        saveToken(accessToken, refreshToken, user);

        user.setPassword(null);
        redisTemplate.opsForValue().set("user:" + user.getId(), user);

        Map<String, Object> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        tokens.put("myProfile", user);
        return tokens;
    }

    public boolean isUsernameAvailable(String username) {
        Optional<User> existingUser = userRepo.findByUsername(username);
        return !existingUser.isPresent();
    }

    public List<Map<String, Object>> searchByUserName(String username) {
        List<User> users = userRepo.findByUsernameContaining(username);
        List<Map<String, Object>> result = new ArrayList<>();

        for (User user : users) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("name", user.getName());
            userMap.put("thumbnailId", user.getThumbnailId());
            result.add(userMap);
        }

        return result;
    }

    public List<LiteUser> findRandomFeedUsers(String mineId, int limit) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.facet()
                        // Step 1: Fetch users I follow or who follow me (private or public)
                        .and(
                                Aggregation.match(
                                        new Criteria().orOperator(
                                                Criteria.where("following").in(mineId),
                                                Criteria.where("followers").in(mineId))),
                                Aggregation.project()
                                        .and("_id").as("id")
                                        .andInclude("username", "name", "thumbnailId"),
                                Aggregation.sample(limit))
                        .as("followedUsers")

                        // Step 2: Fetch random public users (excluding self)
                        .and(
                                Aggregation.match(
                                        new Criteria().and("_id").ne(mineId)
                                                .and("privacy").is(false)),
                                Aggregation.sample(limit),
                                Aggregation.project()
                                        .and("_id").as("id")
                                        .andInclude("username", "name", "thumbnailId"))
                        .as("publicUsers"),

                // Step 3: Merge the results from both facets
                new AggregationOperation() {
                    @SuppressWarnings("null")
                    @Override
                    public Document toDocument(AggregationOperationContext context) {
                        return new Document("$project",
                                new Document("users",
                                        new Document("$concatArrays",
                                                List.of("$followedUsers", "$publicUsers"))));
                    }
                },

                Aggregation.unwind("users"),
                Aggregation.replaceRoot("users"),
                Aggregation.limit(limit));

        return mongoTemplate.aggregate(aggregation, "users", LiteUser.class).getMappedResults();
    }

    public Optional<LiteUser> findLiteUserById(String userId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("_id").is(userId)),
                Aggregation.project()
                        .and("_id").as("id")
                        .andInclude("username", "name", "thumbnailId"));

        List<LiteUser> users = mongoTemplate.aggregate(aggregation, "users", LiteUser.class).getMappedResults();
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    // BY USERNAME
    public User getUserByUsername(String username) throws UserException {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserException("User not found"));
        user.setPassword(null);
        return user;
    }

    // BY USERID
    public User getUserByUserId(String userId) throws UserException {
        String redisKey = "user:" + userId;
        // Check Redis cache first
        User user = redisTemplate.opsForValue().get(redisKey);

        // Fallback to MongoDB if not found
        if (user == null) {
            user = userRepo.findById(userId)
                    .orElseThrow(() -> new UserException("User not found"));
            user.setPassword(null);
            // Store in Redis for future requests
            redisTemplate.opsForValue().set(redisKey, user);
        } else {
            user.setPassword(null); // Just in case it's cached
        }

        return user;
    }

    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            return ((User) principal).getEmail();
        }

        return null;
    }

    // UPATE EMAIL
    public String updateUserEmail(String id, String email) throws UserException {
        String loggedInEmail = getAuthenticatedUserEmail();

        if (!email.equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }

        String redisKey = "user:" + id;

        // Try Redis first
        User existingUser = redisTemplate.opsForValue().get(redisKey);

        // Fallback to Mongo if not cached
        if (existingUser == null) {
            existingUser = userRepo.findById(id)
                    .orElseThrow(() -> new UserException("User not found"));
            existingUser.setPassword(null); // Ensure password is not exposed
        }

        existingUser.setEmail(email);

        // Update Redis cache
        redisTemplate.opsForValue().set(redisKey, existingUser);

        userRepo.save(existingUser);
        return savedUser.getEmail();
    }

    public String updateUserPhone(String id, String phone) throws UserException {
        User existingUser = userRepo.findById(id)
                .orElseThrow(() -> new UserException("User not found"));
        existingUser.setPhone(phone);
        User savedUser = userRepo.save(existingUser);
        return savedUser.getPhone();
    }

    // Update Privacy
    public boolean updatePrivacy(Boolean privacy, String userId) throws UserException {
        // Try fetching from Redis first
        String redisKey = "user:" + userId;

        // Fallback to DB
        User existingUser = userRepo.findById(userId)
                .orElseThrow(() -> new UserException("User not found"));

        existingUser.setPrivacy(privacy);
        // Save to DB
        userRepo.save(existingUser);

        // Update Redis cache
        existingUser.setPassword(null);
        redisTemplate.opsForValue().set(redisKey, existingUser);

        return existingUser.isPrivacy();
    }

    public User updateUser(MultipartFile file, User updatedUser, MultipartFile thumbnail) throws UserException {
        String loggedInEmail = getAuthenticatedUserEmail();

        String redisKey = "user:" + updatedUser.getId();
        User existingUser = redisTemplate.opsForValue().get(redisKey);

        if (existingUser == null) {
            existingUser = userRepo.findById(updatedUser.getId())
                    .orElseThrow(() -> new UserException("User not found"));
        }

        if (!existingUser.getEmail().equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }

        Map<String, Object> updatedFields = new HashMap<>();

        // Profile picture update
        if (file != null && !file.isEmpty()) {
            Map<String, String> uploadImage = imageStorageService.uploadProfileImage(file, existingUser.getId(),
                    thumbnail);
            existingUser.setPhotoId(uploadImage.get("mediaId"));
            existingUser.setThumbnailId(uploadImage.get("thumbnailId"));

            updatedFields.put("photoId", uploadImage.get("mediaId"));
            updatedFields.put("thumbnailId", uploadImage.get("thumbnailId"));
        }

        // Text fields
        if (updatedUser.getWebsite() != null) {
            existingUser.setWebsite(updatedUser.getWebsite());
            updatedFields.put("website", updatedUser.getWebsite());
        }
        if (updatedUser.getUsername() != null) {
            existingUser.setUsername(updatedUser.getUsername());
            updatedFields.put("username", updatedUser.getUsername());
        }
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
            updatedFields.put("name", updatedUser.getName());
        }
        if (updatedUser.getBio() != null) {
            existingUser.setBio(updatedUser.getBio());
            updatedFields.put("bio", updatedUser.getBio());
        }

        // Cache updated user
        redisTemplate.opsForValue().set(redisKey, existingUser);

        existingUser.setPassword(null); // Don't expose
        updatedFields.put("id", existingUser.getId());

        if (!updatedFields.isEmpty()) {
            kafkaProducer.sendToKafka(updatedFields, "UPDATE");
        }

        return existingUser;
    }

    public void deleteUser(String userId) throws UserException {
        String loggedInEmail = getAuthenticatedUserEmail();

        User user = redisTemplate.opsForValue().get("user:" + userId);

        if (user == null) {
            Optional<User> userOptional = userRepo.findById(userId);
            if (userOptional.isEmpty()) {
                throw new UserException("Can't Find User by Id: " + userId);
            }
            user = userOptional.get();
        }

        if (!user.getEmail().equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }

        redisTemplate.delete("user:" + userId);

        userRepo.deleteById(userId);
    }

    private void saveToken(String accessToken, String refreshToken, User user) {
        Token token = new Token();
        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setLoggedOut(false);
        token.setUser(user);
        tokenRepository.save(token);
    }

    public Map<String, String> refreshToken(String refreshToken) throws UserException {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new UserException("Refresh token is missing or malformed");
        }

        String email = jwtUtil.extractUserEmail(refreshToken);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));

        if (!jwtUtil.isRefreshValid(refreshToken, user)) {
            throw new UserException("Invalid refresh token");
        }

        // Generate new tokens
        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);

        // Revoke old tokens and save new ones
        revokeRefreshToken(refreshToken);
        saveToken(newAccessToken, newRefreshToken, user);

        // Return tokens as JSON response
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", newAccessToken);
        tokens.put("refreshToken", newRefreshToken);

        return tokens;
    }

    public void logout(String accessToken) {
        Optional<Token> byAccessToken = tokenRepository.findByAccessToken(accessToken);
        revokeAllTokens(byAccessToken.get().getUser());
    }

    public void revokeRefreshToken(String refreshToken) throws UserException {
        Token token = tokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new UserException("Token not found"));
        tokenRepository.delete(token);
    }

    private void revokeAllTokens(User user) {
        List<Token> validTokens = tokenRepository.findByUser(user.getId());
        if (!validTokens.isEmpty()) {
            tokenRepository.deleteAll(validTokens);
        }
    }

    public void revokeAccessToken(String accessToken) throws UserException {
        Token token = tokenRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new UserException("Token not found"));
        tokenRepository.delete(token);
    }

    public UserDetails loadbyUserId(String userId) throws UsernameNotFoundException {
        // First check Redis
        String redisKey = "user:" + userId;
        User user = redisTemplate.opsForValue().get(redisKey);

        if (user != null) {
            return user;
        }

        // If not found in cache, get from DB
        user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Save to Redis for future requests
        user.setPassword(null);
        redisTemplate.opsForValue().set(redisKey, user);
        return user;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

}