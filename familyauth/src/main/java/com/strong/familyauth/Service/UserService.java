package com.strong.familyauth.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

        user.setUsername(user.getName() + (int) (Math.random() * 90000000) + 10000000);
        user.setBio("");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setEnabled(true);
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

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    email,
                    password));
        } catch (AuthenticationException e) {
            throw new UserException(e.getMessage());
        }

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        revokeAllTokens(refreshToken);
        saveToken(accessToken, refreshToken, user);
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        return tokens;
    }

    public Profile getUserByUsername(String username) throws UserException {
        User user = userRepo.findByusername(username)
                .orElseThrow(() -> new UserException("User not found"));
        Profile profile = new Profile();
        profile.setEmail(user.getEmail());
        profile.setUsername(user.getUsername());
        profile.setName(user.getName());
        profile.setPhone(user.getPhone());
        profile.setPhotoUrl(user.getPhotoUrl());
        profile.setBio(user.getBio());
        profile.setEnabled(user.isEnabled());
        profile.setPrivate(user.isPrivate());
        profile.setAccountNonExpired(user.isAccountNonExpired());
        profile.setAccountNonLocked(user.isAccountNonLocked());
        profile.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        profile.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
        return profile;
    }

    public User getUserByEmail(String email) throws UserException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));
        return user;
    }

    public User updateUser(String id, User userDetails) throws UserException {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserException("Can't Find User by Id: " + id));
        user.setName(userDetails.getName());
        user.setPhotoUrl(userDetails.getPhotoUrl());
        user.setBio(userDetails.getBio());
        return userRepo.save(user);
    }

    public void deleteUser(String id) throws UserException {
        if (!userRepo.existsById(id)) {
            throw new UserException("Can't Find User by Id: " + id);
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
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!jwtUtil.isRefreshValid(refreshToken, user)) {
            throw new UserException("Invalid refresh token");
        }

        // Generate new tokens
        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);

        // Revoke old tokens and save new ones
        revokeAllTokens(refreshToken);
        saveToken(newAccessToken, newRefreshToken, user);

        // Return tokens as JSON response
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", newAccessToken);
        tokens.put("refreshToken", newRefreshToken);

        return tokens;
    }

    private void revokeAllTokens(String refreshToken) {
        Optional<Token> validToken = tokenRepository.findByRefreshToken(refreshToken);
        if (validToken.isPresent()) {
            tokenRepository.delete(validToken.get());
        }
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}