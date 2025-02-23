package com.strong.familyauth.Security;

import java.io.IOException;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.strong.familyauth.Model.User;
import com.strong.familyauth.Service.UserService;
import com.strong.familyauth.Util.JwtUtil;
import com.strong.familyauth.Util.UserException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JwtRequestFilter is a Spring Security filter that intercepts HTTP requests
 * to handle JWT-based authentication.
 */
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * Constructor for JwtRequestFilter.
     *
     * @param userService the service used to load user details.
     * @param jwtUtil     the utility class for handling JWT operations.
     */
    public JwtRequestFilter(@Lazy UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Filters requests to handle JWT-based authentication.
     * 
     * @param request  the HTTP request containing the JWT in the "Authorization"
     *                 header.
     * @param response the HTTP response.
     * @param chain    the filter chain to continue the request processing.
     * @throws ServletException if an error occurs during request processing.
     * @throws IOException      if an I/O error occurs during request processing.
     */
    @SuppressWarnings("null")
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        if (requestURI.contains("/auth/")) {
            chain.doFilter(request, response);
            return;
        }
        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);

            try {
                String email = jwtUtil.extractUserEmail(jwt);
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User userDetails = (User) userService.loadUserByUsername(email);

                    if (userDetails != null && jwtUtil.isTokenValid(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                        chain.doFilter(request, response);
                        return;
                    }
                }
            } catch (UserException e) {
                response.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE);
                response.getWriter().write(e.getMessage());
                return;
            }

        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("Unauthorized");
        chain.doFilter(request, response);
    }
}
