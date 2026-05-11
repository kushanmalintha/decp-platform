package com.decp.user_service.controller;

import com.decp.user_service.dto.UpdateUserRequest;
import com.decp.user_service.dto.CreateUserRequest;
import com.decp.user_service.entity.UserProfile;
import com.decp.user_service.security.JwtUtil;
import com.decp.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<UserProfile> createUser(@RequestBody CreateUserRequest request) {
        UserProfile user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/me")
    public UserProfile getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return userService.getOrCreateUser(user.email());
    }

    @PutMapping("/me")
    public UserProfile updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateUserRequest request) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return userService.updateUser(user.email(), request);
    }

    @GetMapping("/{id}")
    public UserProfile getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
