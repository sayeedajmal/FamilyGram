package com.strong.familypost.Security;

import java.io.IOException;
import java.util.Collection;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.strong.familypost.Model.User;
import com.strong.familypost.Util.JwtUtil;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtRequestFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @SuppressWarnings("null")
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String email = jwtUtil.extractUserEmail(token);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (jwtUtil.validateToken(token)) {
                        Claims claims = jwtUtil.extractClaims(token);
                        String userId = claims.get("userId", String.class);
                        String username = claims.get("username", String.class);
                        String name = claims.get("name", String.class);
                        String phone = claims.get("phone", String.class);
                        boolean isPrivate = claims.get("isPrivate", Boolean.class);
                        boolean isEnabled = claims.get("enabled", Boolean.class);
                        boolean isAccountNonLocked = claims.get("accountNonLocked", Boolean.class);
                        boolean isAccountNonExpired = claims.get("accountNonExpired", Boolean.class);
                        @SuppressWarnings("unchecked")
                        Collection<SimpleGrantedAuthority> authorities = (Collection<SimpleGrantedAuthority>) claims
                                .get("authorities", Collection.class);

                        User userDetails = new User(
                                email, userId, username, name, phone, isPrivate, isEnabled, isAccountNonLocked,
                                isAccountNonExpired, authorities);
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    }
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_NOT_ACCEPTABLE);
                response.getWriter().write(e.getLocalizedMessage());
                return;
            }
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Check Your Token");
            return;
        }
        chain.doFilter(request, response);
    }
}
