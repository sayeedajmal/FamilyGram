package com.strong.familyauth.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

import com.strong.familyauth.Model.Profile;
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
        user.setPhotoId("");
        user.setPrivate(false);
        user.setFollowerCount(0);
        user.setFollowingCount(0);
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
            throw new UserException("Your account has expired", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isAccountNonLocked()) {
            throw new UserException("Your account is locked", HttpStatus.UNAUTHORIZED);
        }
        if (!user.isEnabled()) {
            throw new UserException("Your account is disabled", HttpStatus.UNAUTHORIZED);
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    email,
                    password));
        } catch (AuthenticationException e) {
            throw new UserException(e.getMessage());
        }

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        saveToken(accessToken, refreshToken, user);
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        return tokens;
    }

    public boolean isUsernameAvailable(String username) {
        Optional<User> existingUser = userRepo.findByusername(username);
        return !existingUser.isPresent();
    }

    public Profile getUserByUsername(String username) throws UserException {
        User user = userRepo.findByusername(username)
                .orElseThrow(() -> new UserException("User not found"));
        Profile profile = new Profile();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setUsername(user.getUsername());
        profile.setName(user.getName());
        profile.setPhone(user.getPhone());
        profile.setPhotoId(user.getPhotoId());
        profile.setBio(user.getBio());
        profile.setWebsite(user.getWebsite());
        profile.setPrivate(user.isPrivate());
        profile.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        profile.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
        return profile;
    }

    public Profile getUserByEmail(String email) throws UserException {

        String loggedInEmail = getAuthenticatedUserEmail();

        if (!email.equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));
        Profile profile = new Profile();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setUsername(user.getUsername());
        profile.setName(user.getName());
        profile.setPhone(user.getPhone());
        profile.setPhotoId(user.getPhotoId());
        profile.setBio(user.getBio());
        profile.setWebsite(user.getWebsite());
        profile.setPrivate(user.isPrivate());
        profile.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        profile.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
        return profile;
    }

    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof User) {
            return ((User) principal).getEmail();
        }

        return null;
    }

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

    public Profile updateUser(MultipartFile file, User updatedUser) throws UserException {
        String loggedInEmail = getAuthenticatedUserEmail();

        if (!updatedUser.getEmail().equals(loggedInEmail)) {
            throw new UserException("You are not authorized to access this profile");
        }
        // Fetch the existing user from the database
        User existingUser = userRepo.findById(updatedUser.getId())
                .orElseThrow(() -> new UserException("User not found"));

        // Handle profile picture update
        if (file != null && !file.isEmpty()) {
            String uploadImage = imageStorageService.uploadProfileImage(file, existingUser.getId());
            existingUser.setPhotoId(uploadImage);
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

        User savedUser = userRepo.save(existingUser);
        Profile profile = new Profile();
        profile.setId(savedUser.getId());
        profile.setEmail(savedUser.getEmail());
        profile.setUsername(savedUser.getUsername());
        profile.setName(savedUser.getName());
        profile.setPhone(savedUser.getPhone());
        profile.setPhotoId(savedUser.getPhotoId());
        profile.setBio(savedUser.getBio());
        profile.setWebsite(savedUser.getWebsite());
        profile.setPrivate(savedUser.isPrivate());
        profile.setFollowerCount(savedUser.getFollowers() != null ? savedUser.getFollowers().size() : 0);
        profile.setFollowingCount(savedUser.getFollowing() != null ? savedUser.getFollowing().size() : 0);
        return profile;
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

    @SuppressWarnings("unused")
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