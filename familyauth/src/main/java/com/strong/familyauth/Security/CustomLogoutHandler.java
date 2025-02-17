package com.strong.familyauth.Security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import com.strong.familyauth.Model.Token;
import com.strong.familyauth.Repository.TokenRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * CustomLogoutHandler is a Spring Security component responsible for handling
 * logout operations.
 * It implements the LogoutHandler interface and performs custom logic during
 * logout, such as
 * updating the token status in the database.
 */
@Configuration
public class CustomLogoutHandler implements LogoutHandler {

    private final TokenRepository tokenRepository;

    /**
     * Constructor for CustomLogoutHandler.
     *
     * @param tokenRepository the repository used to interact with tokens in the
     *                        database.
     */
    public CustomLogoutHandler(TokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Handles the logout process by invalidating the token associated with the
     * logout request.
     *
     * @param request        the HTTP request containing the logout request details.
     * @param response       the HTTP response to be sent back to the client.
     * @param authentication the authentication object representing the current
     *                       user.
     * 
     *                       This method extracts the JWT token from the
     *                       "Authorization" header of the request,
     *                       marks it as logged out in the database, and saves the
     *                       updated token status.
     *                       The token is expected to be in the format "Bearer
     *                       <token>".
     */
    @Override
    public void logout(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {
        // Extract the Authorization header from the request
        String authHeader = request.getHeader("Authorization");

        // Check if the Authorization header is present and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return; // If not, do nothing
        }

        // Extract the token from the header
        String token = authHeader.substring(7);

        // Find the token in the database
        Token storedToken = tokenRepository.findByAccessToken(token).orElse(null);

        // If the token is found, mark it as logged out
        if (storedToken != null) {
            storedToken.setLoggedOut(true);
            tokenRepository.save(storedToken);
        }
    }
}