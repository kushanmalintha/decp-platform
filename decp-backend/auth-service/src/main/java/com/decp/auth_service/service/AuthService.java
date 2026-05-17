package com.decp.auth_service.service;

import com.decp.auth_service.client.UserServiceClient;
import com.decp.auth_service.dto.*;
import com.decp.auth_service.entity.PasswordResetToken;
import com.decp.auth_service.entity.RefreshToken;
import com.decp.auth_service.entity.User;
import com.decp.auth_service.repository.PasswordResetTokenRepository;
import com.decp.auth_service.repository.RefreshTokenRepository;
import com.decp.auth_service.repository.UserRepository;
import com.decp.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserServiceClient userServiceClient;
    private final EmailService emailService;
    private static final String[] ALLOWED_ROLES = {"STUDENT", "ALUMNI", "ADMIN"};
    private static final String TOKEN_TYPE = "Bearer";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Value("${password-reset.token-expiration-ms:900000}")
    private long passwordResetTokenExpirationMs;

    @Value("${app.frontend-reset-url:http://localhost:3000/reset-password}")
    private String frontendResetUrl;

    @Transactional
    public void register(RegisterRequest request) {
        String name = request.getName() != null ? request.getName() : request.getEmail();
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(name)
                .role("STUDENT")
                .build();

        userRepository.save(user);

        // Sync user to user-service
        CreateUserRequest createUserRequest = new CreateUserRequest(
                request.getEmail(),
                name,
                "STUDENT"
        );
        userServiceClient.createUser(createUserRequest);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        log.info("Login successful userEmail={} userRole={}", user.getEmail(), user.getRole());
        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = getRefreshToken(request == null ? null : request.getRefreshToken());

        if (refreshToken.isRevoked()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            revoke(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        User user = userRepository.findByEmail(refreshToken.getUserEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token user is invalid"));

        revoke(refreshToken);
        log.info("Refresh token rotated userEmail={}", user.getEmail());
        return issueTokenPair(user);
    }

    @Transactional
    public LogoutResponse logout(LogoutRequest request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            return new LogoutResponse("Logged out successfully");
        }

        refreshTokenRepository.findByTokenHash(hashToken(request.getRefreshToken()))
                .ifPresent(this::revoke);

        return new LogoutResponse("Logged out successfully");
    }

    @Transactional
    public LogoutResponse changePassword(String email, ChangePasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password change request is required");
        }
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        revokeRefreshTokensForUser(user.getEmail());

        log.info("Password changed and refresh tokens revoked userEmail={}", user.getEmail());
        return new LogoutResponse("Password changed successfully. Please log in again.");
    }

    @Transactional
    public LogoutResponse forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String email = request.getEmail().trim();
        userRepository.findByEmail(email).ifPresent(user -> {
            LocalDateTime now = LocalDateTime.now();
            passwordResetTokenRepository.findByUserEmailAndUsedAtIsNull(user.getEmail())
                    .forEach(existingToken -> {
                        existingToken.setUsedAt(now);
                        passwordResetTokenRepository.save(existingToken);
                    });

            String rawToken = generateSecureToken();
            passwordResetTokenRepository.save(PasswordResetToken.builder()
                    .tokenHash(hashToken(rawToken))
                    .userEmail(user.getEmail())
                    .expiresAt(now.plus(Duration.ofMillis(passwordResetTokenExpirationMs)))
                    .createdAt(now)
                    .build());

            String resetLink = buildResetLink(rawToken);
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
            log.info("Password reset email sent userEmail={}", user.getEmail());
        });

        return new LogoutResponse("If an account exists for this email, a reset link has been sent.");
    }

    @Transactional
    public LogoutResponse resetPassword(ResetPasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset request is required");
        }
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(hashToken(request.getToken()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        LocalDateTime now = LocalDateTime.now();
        if (resetToken.getExpiresAt().isBefore(now)) {
            resetToken.setUsedAt(now);
            passwordResetTokenRepository.save(resetToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        User user = userRepository.findByEmail(resetToken.getUserEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.findByUserEmailAndUsedAtIsNull(user.getEmail())
                .forEach(existingToken -> {
                    existingToken.setUsedAt(now);
                    passwordResetTokenRepository.save(existingToken);
                });
        revokeRefreshTokensForUser(user.getEmail());

        log.info("Password reset completed and refresh tokens revoked userEmail={}", user.getEmail());
        return new LogoutResponse("Password reset successfully. Please log in again.");
    }

    public RoleAssignmentResponse assignRole(String requesterEmail, String targetEmail, String newRole) {
        // Validate the new role
        if (!isValidRole(newRole)) {
            throw new IllegalArgumentException("Invalid role: " + newRole + ". Allowed roles: STUDENT, ALUMNI, ADMIN");
        }

        // Prevent assigning ADMIN role if requester is not ADMIN
        if ("ADMIN".equals(newRole)) {
            throw new IllegalArgumentException("Only existing ADMIN users can assign ADMIN role");
        }

        // Prevent changing own role
        if (requesterEmail.equals(targetEmail)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        // Find and update the target user
        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + targetEmail));

        targetUser.setRole(newRole);
        User updatedUser = userRepository.save(targetUser);

        return new RoleAssignmentResponse(
                updatedUser.getId(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                "Role updated successfully"
        );
    }

    private boolean isValidRole(String role) {
        for (String allowedRole : ALLOWED_ROLES) {
            if (allowedRole.equals(role)) {
                return true;
            }
        }
        return false;
    }

    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken();
        LocalDateTime now = LocalDateTime.now();

        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(hashToken(refreshToken))
                .userEmail(user.getEmail())
                .expiresAt(now.plus(Duration.ofMillis(refreshTokenExpirationMs)))
                .revoked(false)
                .createdAt(now)
                .build());

        return new AuthResponse(accessToken, refreshToken, TOKEN_TYPE);
    }

    private RefreshToken getRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is required");
        }

        return refreshTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
    }

    private void revoke(RefreshToken refreshToken) {
        if (!refreshToken.isRevoked()) {
            refreshToken.setRevoked(true);
            refreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
        }
    }

    private void revokeRefreshTokensForUser(String email) {
        refreshTokenRepository.findByUserEmailAndRevokedFalse(email)
                .forEach(this::revoke);
    }

    private String generateSecureToken() {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String buildResetLink(String token) {
        String separator = frontendResetUrl.contains("?") ? "&" : "?";
        return frontendResetUrl + separator + "token=" + token;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 hashing is not available", e);
        }
    }
}
