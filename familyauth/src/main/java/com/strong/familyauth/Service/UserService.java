package com.strong.familyauth.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.strong.familyauth.Model.Token;
import com.strong.familyauth.Model.User;
import com.strong.familyauth.Repository.TokenRepository;
import com.strong.familyauth.Repository.UserRepository;
import com.strong.familyauth.Util.JwtUtil;
import com.strong.familyauth.Util.UserException;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TokenRepository tokenRepository;

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    public User getUserById(String id) throws UserException {
        return userRepo.findById(id)
                .orElseThrow(() -> new UserException("User not found by this id: " + id));
    }

    public User findByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public String signUp(User user) throws UserException {
        Optional<User> existingUser = userRepo.findByEmail(user.getEmail().toLowerCase());
        if (existingUser.isPresent()) {
            throw new UserException("Email already in use: " + user.getEmail());
        }

        user.setUsername(user.getName());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setEnabled(true);

        userRepo.save(user);

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        saveToken(accessToken, refreshToken, user);

        return accessToken;
    }

    public String authenticate(String email, String password) throws UserException {
        User authenticatedUser = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    email,
                    password));
        } catch (AuthenticationException e) {
            throw new UserException(e.getMessage());
        }

        String accessToken = jwtUtil.generateAccessToken(authenticatedUser);
        String refreshToken = jwtUtil.generateRefreshToken(authenticatedUser);

        revokeAllTokens(authenticatedUser);
        saveToken(accessToken, refreshToken, authenticatedUser);
        return accessToken;
    }

    public User updateUser(String id, User userDetails) throws UserException {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserException("Can't Find User by Id: " + id));

        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setBio(userDetails.getBio());
        user.setPhotoUrl(userDetails.getPhotoUrl());

        return userRepo.save(user);
    }

    public void deleteUser(String id) throws UserException {
        if (!userRepo.existsById(id)) {
            throw new UserException("Can't Find User by Id: " + id);
        }
        userRepo.deleteById(id);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return (UserDetails) user;
    }

    private void saveToken(String accessToken, String refreshToken, User user) {
        Token token = new Token();
        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setLoggedOut(false);
        token.setUser(user);
        tokenRepository.save(token);
    }

    public ResponseEntity<String> refreshToken(HttpServletRequest request) throws UserException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new ResponseEntity<>("Refresh token is missing or malformed", HttpStatus.UNAUTHORIZED);
        }

        String refreshToken = authHeader.substring(7);
        String email = jwtUtil.extractUserEmail(refreshToken);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (jwtUtil.isRefreshValid(refreshToken, user)) {
            String newAccessToken = jwtUtil.generateAccessToken(user);
            String newRefreshToken = jwtUtil.generateRefreshToken(user);

            revokeAllTokens(user);
            saveToken(newAccessToken, newRefreshToken, user);

            return new ResponseEntity<>(newAccessToken, HttpStatus.OK);
        }

        return new ResponseEntity<>("Invalid refresh token", HttpStatus.UNAUTHORIZED);
    }

    private void revokeAllTokens(User user) {
        List<Token> validTokens = tokenRepository.findByUser(user.getUsername());
        if (validTokens.isEmpty()) {
            return;
        }
        validTokens.forEach(token -> {
            tokenRepository.delete(token);
        });
    }
}