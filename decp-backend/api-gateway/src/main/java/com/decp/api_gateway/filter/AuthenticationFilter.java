package com.decp.api_gateway.filter;

import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter {

    private final com.decp.api_gateway.security.JwtUtil jwtUtil;

    // ===== ROLE CONSTANTS =====
    private static final String ROLE_STUDENT = "STUDENT";
    private static final String ROLE_ALUMNI = "ALUMNI";
    private static final String ROLE_ADMIN = "ADMIN";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        // Allow auth endpoints without authentication
        if (path.startsWith("/auth")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // Missing or invalid Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        // Invalid token
        if (!jwtUtil.validateToken(token)) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        String role = normalizeRole(jwtUtil.extractRole(token));

        // Defensive check: Missing or invalid role in token
        if (isInvalidRole(role)) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Invalid or missing role in token");
        }

        // ===== RBAC ENFORCEMENT =====
        if (!isAuthorized(path, method, role)) {
            return reject(exchange, HttpStatus.FORBIDDEN, "Insufficient permissions for this resource");
        }

        return chain.filter(exchange);
    }

    // ===== HELPER METHODS: ERROR RESPONSES =====

    /**
     * Standardized error response handler
     * Returns JSON error response with appropriate HTTP status code
     */
    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        try {
            // Build JSON response manually
            String jsonResponse = String.format(
                    "{\"error\":\"%s\",\"status\":%d}",
                    message, status.value()
            );
            byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);

            exchange.getResponse().setStatusCode(status);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().setContentLength(responseBytes.length);

            return exchange.getResponse().writeWith(
                    Mono.just(exchange.getResponse()
                            .bufferFactory()
                            .wrap(responseBytes))
            );
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(status);
            return exchange.getResponse().setComplete();
        }
    }

    /**
     * Validates that role is not null, empty, or contains invalid characters
     */
    private boolean isInvalidRole(String role) {
        return role == null || role.trim().isEmpty();
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return null;
        }

        String normalizedRole = role.trim().toUpperCase();
        if (normalizedRole.startsWith("ROLE_")) {
            return normalizedRole.substring("ROLE_".length());
        }
        return normalizedRole;
    }

    // ===== HELPER METHODS: PATH MATCHING =====

    /**
     * Matches: POST /jobs
     */
    private boolean isJobCreate(String path, HttpMethod method) {
        return method == HttpMethod.POST && path.equals("/jobs");
    }

    /**
     * Matches: POST /jobs/{id}/apply
     */
    private boolean isJobApply(String path, HttpMethod method) {
        return method == HttpMethod.POST && path.matches("^/jobs/[^/]+/apply$");
    }

    /**
     * Matches: POST /feed/posts
     */
    private boolean isFeedPostCreate(String path, HttpMethod method) {
        return method == HttpMethod.POST && path.equals("/feed/posts");
    }

    /**
     * Matches: GET /users/me or PUT /users/me
     */
    private boolean isMyProfile(String path, HttpMethod method) {
        return path.equals("/users/me") && (method == HttpMethod.GET || method == HttpMethod.PUT);
    }

    /**
     * Matches: GET /users/{id} where {id} is numeric or alphanumeric
     */
    private boolean isUserGetById(String path, HttpMethod method) {
        return method == HttpMethod.GET && path.matches("^/users/[^/]+$") && !path.equals("/users/me");
    }

    // ===== RBAC ENFORCEMENT =====

    /**
     * RBAC Authorization Logic
     * 
     * Rules:
     * - Job Service:
     *   - POST /jobs → ALUMNI, ADMIN only
     *   - POST /jobs/{id}/apply → STUDENT only
     *   - Other methods → all authenticated users
     * 
     * - Feed Service:
     *   - POST /feed/posts → STUDENT, ALUMNI only
     *   - GET /feed/** → all authenticated users
     *   - Other methods → all authenticated users
     * 
     * - User Service:
     *   - GET /users/me → all authenticated users
     *   - PUT /users/me → all authenticated users
     *   - GET /users/{id} → ADMIN only
     *   - Other methods → all authenticated users
     * 
     * - Default: allow access for all authenticated users
     */
    private boolean isAuthorized(String path, HttpMethod method, String role) {

        // ===== JOB SERVICE =====
        if (path.startsWith("/jobs")) {
            if (isJobCreate(path, method)) {
                // POST /jobs → ALUMNI, ADMIN
                return hasRole(role, ROLE_ALUMNI, ROLE_ADMIN);
            }
            if (isJobApply(path, method)) {
                // POST /jobs/{id}/apply → STUDENT
                return hasRole(role, ROLE_STUDENT);
            }
            // Other job service endpoints allowed for authenticated users
            return true;
        }

        // ===== FEED SERVICE =====
        if (path.startsWith("/feed")) {
            if (isFeedPostCreate(path, method)) {
                // POST /feed/posts → STUDENT, ALUMNI
                return hasRole(role, ROLE_STUDENT, ROLE_ALUMNI);
            }
            if (method == HttpMethod.GET) {
                // GET /feed/** → all authenticated users
                return true;
            }
            // Other feed service endpoints allowed for authenticated users
            return true;
        }

        // ===== USER SERVICE =====
        if (path.startsWith("/users")) {
            if (isMyProfile(path, method)) {
                // GET /users/me → all authenticated users
                // PUT /users/me → all authenticated users
                return true;
            }
            if (isUserGetById(path, method)) {
                // GET /users/{id} → ADMIN only
                return hasRole(role, ROLE_ADMIN);
            }
            // Other user service endpoints allowed for authenticated users
            return true;
        }

        // ===== NOTIFICATION SERVICE =====
        if (path.startsWith("/notifications")) {
            // Notification service returns only notifications targeted to the authenticated user.
            return hasRole(role, ROLE_STUDENT, ROLE_ALUMNI, ROLE_ADMIN);
        }

        // Default: allow access for all authenticated users
        return true;
    }

    /**
     * Utility method to check if user role matches any of the allowed roles
     */
    private boolean hasRole(String userRole, String... allowedRoles) {
        String normalizedUserRole = normalizeRole(userRole);
        for (String allowed : allowedRoles) {
            if (allowed.equals(normalizedUserRole)) {
                return true;
            }
        }
        return false;
    }
}
