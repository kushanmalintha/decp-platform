package com.decp.auth_service.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.Key;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${JWT_SECRET:}")
    private String secret;

    @Value("${jwt.access-token-expiration-ms:1800000}")
    private long accessTokenExpirationMs;

    public String generateToken(String email, String role) {
        return generateAccessToken(email, role);
    }

    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(signingKey())
                .compact();
    }

    public String generateRefreshToken() {
        byte[] randomBytes = new byte[64];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key signingKey() {
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "JWT secret is not configured");
        }
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
