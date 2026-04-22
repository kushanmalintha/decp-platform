package com.decp.user_service.controller;

import com.decp.user_service.dto.UpdateUserRequest;
import com.decp.user_service.entity.UserProfile;
import com.decp.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfile getMyProfile(
            @RequestHeader("X-User-Email") String email) {
        return userService.getOrCreateUser(email);
    }

    @PutMapping("/me")
    public UserProfile updateProfile(
            @RequestHeader("X-User-Email") String email,
            @RequestBody UpdateUserRequest request) {
        return userService.updateUser(email, request);
    }

    @GetMapping("/{id}")
    public UserProfile getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
