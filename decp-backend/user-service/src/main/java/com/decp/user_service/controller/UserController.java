package com.decp.user_service.controller;

import com.decp.user_service.dto.UpdateUserRequest;
import com.decp.user_service.dto.CreateUserRequest;
import com.decp.user_service.dto.UserProfileResponse;
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
    public ResponseEntity<UserProfileResponse> createUser(@RequestBody CreateUserRequest request) {
        UserProfileResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return userService.getOrCreateUser(user.email(), user.role());
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateUserRequest request) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return userService.updateUser(user.email(), user.role(), request);
    }

    @GetMapping("/{id}")
    public UserProfileResponse getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
