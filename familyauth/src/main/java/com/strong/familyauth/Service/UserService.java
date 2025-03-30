package com.strong.familyauth.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperationContext;
import org.springframework.data.mongodb.core.query.Criteria;
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

    public boolean canAccessProfile(String mineId, String yourId) {
        Optional<User> userOptional = userRepo.findById(yourId);

        // If user doesn't exist, deny access
        if (userOptional.isEmpty()) {
            return false;
        }

        User user = userOptional.get();

        // If the account is public, anyone can access
        if (!user.isPrivate()) {
            return true;
        }

        // If private, check if mineId is in followers
        return user.getFollowers().contains(mineId);
    }

    public Set<String> getFollowers(String mineId, String yourId) {
        boolean canAccessProfile = canAccessProfile(mineId, yourId);
        if (canAccessProfile) {
            return userRepo.getFollowersById(yourId).orElse(new HashSet<>());
        }
        return new HashSet<>();
    }

    public Set<String> getFollowings(String mineId, String yourId) {
        boolean canAccessProfile = canAccessProfile(mineId, yourId);
        if (canAccessProfile) {
            return userRepo.getFollowingById(yourId).orElse(new HashSet<>());
        }
        return new HashSet<>();
    }

    public String sendEmailOtp(String email) throws UserException {
        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new UserException("Email already in use: " + email);
        }
        emailService.sendOtpEmail(email);
        return "Email sent successfully! Validity is 3 Minutes.";
    }

    public Map<String, String> signUp(User user) throws UserException {
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
        user.setPrivate(false);
        user.setFollowers(new HashSet<>());
        user.setFollowing(new HashSet<>());
        user.setWebsite("");

        userRepo.save(user);

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        saveToken(accessToken, refreshToken, user);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);

        return tokens;
    }

    public boolean acceptFollowRequest(String mineId, String userId) {
        Optional<User> mineUserOpt = userRepo.findById(mineId);
        Optional<User> userOpt = userRepo.findById(userId);

        if (mineUserOpt.isPresent() && userOpt.isPresent()) {
            User mineUser = mineUserOpt.get();
            User user = userOpt.get();

            // Check if userId is in mineUser's followRequests
            if (mineUser.getFollowRequests().contains(userId)) {
                // Remove from followRequests
                mineUser.getFollowRequests().remove(userId);

                // Add userId to mineUser's followers
                mineUser.getFollowers().add(userId);

                // Add mineId to user's following list
                user.getFollowing().add(mineId);

                // Save both users
                userRepo.save(mineUser);
                userRepo.save(user);

                return true;
            }
        }
        return false;
    }

    // ADD FOLLOWER
    public String toggleFollower(String mineId, String yourId, String imageUrl) throws UserException {
        Optional<User> mineOptional = userRepo.findById(mineId);
        Optional<User> yourOptional = userRepo.findById(yourId);

        if (mineOptional.isEmpty() || yourOptional.isEmpty()) {
            throw new UserException("User not found");
        }

        User mine = mineOptional.get();
        User your = yourOptional.get();

        // Check if the user is private
        if (your.isPrivate()) {
            if (your.getFollowRequests() == null) {
                your.setFollowRequests(new HashSet<>());
            }

            // If already requested, remove the request (toggle behavior)
            if (your.getFollowRequests().contains(mineId)) {
                your.getFollowRequests().remove(mineId);
                userRepo.save(your);
                return "Follow request removed.";
            }

            // Else, send a new follow request
            emailService.sendFollowRequestEmail(your.getEmail(), mine.getEmail(), imageUrl);
            your.getFollowRequests().add(mineId);
            userRepo.save(your);
            return "Follow request sent successfully.";
        }

        // Handle following/unfollowing for non-private accounts
        if (mine.getFollowing().contains(yourId)) {
            // If already following, unfollow (remove from following and followers)
            mine.getFollowing().remove(yourId);
            your.getFollowers().remove(mineId);
            userRepo.save(mine);
            userRepo.save(your);
            return "Unfollowed successfully.";
        } else {
            // If not following, follow (add to following and followers)
            mine.getFollowing().add(yourId);
            your.getFollowers().add(mineId);
            // Saving the users
            userRepo.save(mine);
            userRepo.save(your);
            return "Followed successfully.";
        }
    }

    public Map<String, String> authenticate(String email, String password) throws UserException {
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
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
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
                                                .and("isPrivate").is(false)),
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

    // FOR POST
    public Map<String, Object> userForPost(String yourId, String mineId) {
        if (!canAccessProfile(mineId, yourId)) {
            return null;
        }

        Optional<User> userOptional = userRepo.findById(yourId);
        if (userOptional.isEmpty()) {
            return null;
        }

        User user = userOptional.get();
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("name", user.getName());
        userMap.put("thumbnailId", user.getThumbnailId());

        return userMap;
    }

    // BY USERNAME
    public User getUserByUsername(String mineId, String username) throws UserException {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserException("User not found"));
        user.setPassword(null);
        return user;
    }

    public User getbyId(String userId) throws UserException {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserException("User not found"));
        user.setPassword(null);
        return user;
    }

    // BY USERID
    public User getUserByUserId(String mineId, String userId) throws UserException {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserException("User not found"));
        user.setPassword(null);
        return user;
    }

    // BY EMAIL
    public User getUserByEmail(String email) throws UserException {
        String authenticatedUserEmail = getAuthenticatedUserEmail();
        if (!email.equals(authenticatedUserEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));
        user.setPassword(null);
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
        User existingUser = userRepo.findById(id)
                .orElseThrow(() -> new UserException("User not found"));
        existingUser.setEmail(email);
        User savedUser = userRepo.save(existingUser);
        return savedUser.getEmail();
    }

    public String updateUserPhone(String id, String phone) throws UserException {
        User existingUser = userRepo.findById(id)
                .orElseThrow(() -> new UserException("User not found"));
        existingUser.setPhone(phone);
        User savedUser = userRepo.save(existingUser);
        return savedUser.getPhone();
    }

    public String removeFollow(String mineId, String yourId) {
        Optional<User> mineOptional = userRepo.findById(mineId);
        Optional<User> yourOptional = userRepo.findById(yourId);

        if (mineOptional.isEmpty() || yourOptional.isEmpty()) {
            return "User not found";
        }

        User mine = mineOptional.get();
        User your = yourOptional.get();
        // Case 1: Reject follow request (if exists)
        if (mine.getFollowRequests().contains(yourId)) {
            mine.getFollowRequests().remove(yourId);
            userRepo.save(mine);
            return "Follow request rejected.";
        }
        // Check if mine is following yourId
        if (mine.getFollowing().contains(yourId)) {
            // Remove yourId from mine's following list
            mine.getFollowing().remove(yourId);
            userRepo.save(mine);

            // Remove mineId from your's followers list
            your.getFollowers().remove(mineId);
            userRepo.save(your);

            return "Unfollowed successfully.";
        } else {
            return "You are not following this user.";
        }
    }

    // Update Privacy
    public boolean UpdatePrivacy(Boolean isPrivate, String id) throws UserException {
        User existingUser = userRepo.findById(id)
                .orElseThrow(() -> new UserException("User not found"));
        existingUser.setPrivate(isPrivate);
        User savedUser = userRepo.save(existingUser);
        return savedUser.isPrivate();
    }

    public User updateUser(MultipartFile file, User updatedUser, MultipartFile thumbnail) throws UserException {
        String loggedInEmail = getAuthenticatedUserEmail();

        if (!updatedUser.getEmail().equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }
        // Fetch the existing user from the database
        User existingUser = userRepo.findById(updatedUser.getId())
                .orElseThrow(() -> new UserException("User not found"));

        // Handle profile picture update
        if (file != null && !file.isEmpty()) {
            Map<String, String> uploadImage = imageStorageService.uploadProfileImage(file, existingUser.getId(),
                    thumbnail);
            existingUser.setPhotoId(uploadImage.get("mediaId"));
            existingUser.setThumbnailId(uploadImage.get("thumbnailId"));
        }

        // Update only non-null fields
        if (updatedUser.getWebsite() != null) {
            existingUser.setWebsite(updatedUser.getWebsite());
        }
        if (updatedUser.getUsername() != null) {
            existingUser.setUsername(updatedUser.getUsername());
        }
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }

        if (updatedUser.getBio() != null) {
            existingUser.setBio(updatedUser.getBio());
        }

        User user = userRepo.save(existingUser);
        user.setPassword(null);
        return user;
    }

    public void deleteUser(String id) throws UserException {

        String loggedInEmail = getAuthenticatedUserEmail();
        Optional<User> userOptional = userRepo.findById(id);
        if (userOptional.isEmpty()) {
            throw new UserException("Can't Find User by Id: " + id);
        }

        User user = userOptional.get();
        if (!user.getEmail().equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }

        userRepo.deleteById(id);
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

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}