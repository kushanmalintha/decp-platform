package com.decp.user_service.service;

import com.decp.user_service.dto.UpdateUserRequest;
import com.decp.user_service.entity.UserProfile;
import com.decp.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfile getOrCreateUser(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(
                        UserProfile.builder()
                                .email(email)
                                .role("STUDENT")
                                .build()
                ));
    }

    public UserProfile updateUser(String email, UpdateUserRequest request) {
        UserProfile user = getOrCreateUser(email);
        user.setName(request.getName());
        return userRepository.save(user);
    }

    public UserProfile getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
