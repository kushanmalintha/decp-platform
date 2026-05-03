package com.decp.api_gateway.filter;

import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter {

    private final com.decp.api_gateway.security.JwtUtil jwtUtil;

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
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        // Invalid token
        if (!jwtUtil.validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        // Missing role in token
        if (role == null || role.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // ===== RBAC RULES =====

        // Check if user is authorized for this endpoint
        if (!isAuthorized(path, method, role)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        // Add user information to request headers for downstream services
        exchange = exchange.mutate()
                .request(r -> r
                        .header("X-User-Email", email)
                        .header("X-User-Role", role))
                .build();

        return chain.filter(exchange);
    }

    /**
     * RBAC Authorization Logic
     * 
     * Rules:
     * - Job Service:
     *   - POST /jobs → ALUMNI, ADMIN
     *   - POST /jobs/{id}/apply → STUDENT
     * - Feed Service:
     *   - POST /feed/posts → STUDENT, ALUMNI
     *   - GET /feed/** → all authenticated
     * - User Service:
     *   - GET /users/me → all authenticated
     *   - PUT /users/me → all authenticated
     *   - GET /users/{id} → ADMIN only
     */
    private boolean isAuthorized(String path, HttpMethod method, String role) {

        // ===== JOB SERVICE =====
        if (path.startsWith("/jobs")) {
            if (method == HttpMethod.POST && path.equals("/jobs")) {
                // POST /jobs → ALUMNI, ADMIN
                return role.equals("ALUMNI") || role.equals("ADMIN");
            }
            if (method == HttpMethod.POST && path.contains("/apply")) {
                // POST /jobs/{id}/apply → STUDENT
                return role.equals("STUDENT");
            }
            // Other job service endpoints allowed for authenticated users
            return true;
        }

        // ===== FEED SERVICE =====
        if (path.startsWith("/feed")) {
            if (method == HttpMethod.POST && path.equals("/feed/posts")) {
                // POST /feed/posts → STUDENT, ALUMNI
                return role.equals("STUDENT") || role.equals("ALUMNI");
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
            if (path.equals("/users/me")) {
                // GET /users/me → all authenticated users
                // PUT /users/me → all authenticated users
                if (method == HttpMethod.GET || method == HttpMethod.PUT) {
                    return true;
                }
            }
            if (method == HttpMethod.GET && path.matches("^/users/[^/]+$")) {
                // GET /users/{id} → ADMIN only
                return role.equals("ADMIN");
            }
            // Other user service endpoints allowed for authenticated users
            return true;
        }

        // Default: allow access for authenticated users
        return true;
    }
}
