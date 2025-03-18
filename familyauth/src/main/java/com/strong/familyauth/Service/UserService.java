package com.strong.familyauth.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
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
        user.setFollowerCount(0);
        user.setFollowingCount(0);
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

    public Map<String, Object> liteUser(String userId) {
        Optional<User> userOptional = userRepo.findById(userId);

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
        boolean canAccessProfile = canAccessProfile(mineId, user.getId());
        if (canAccessProfile) {
            user.setFollowers(user.getFollowers());
            user.setFollowing(user.getFollowing());
        }
        user.setFollowers(new HashSet<>());
        user.setFollowing(new HashSet<>());
        user.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        user.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
        user.setPassword(null);
        return user;
    }

    // BY USERID
    public User getUserByUserId(String mineId, String userId) throws UserException {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserException("User not found"));
        boolean canAccessProfile = canAccessProfile(mineId, userId);
        if (canAccessProfile) {
            user.setFollowers(user.getFollowers());
            user.setFollowing(user.getFollowing());
        }
        user.setFollowers(new HashSet<>());
        user.setFollowing(new HashSet<>());
        user.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        user.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
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
        user.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        user.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
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
        user.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        user.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
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