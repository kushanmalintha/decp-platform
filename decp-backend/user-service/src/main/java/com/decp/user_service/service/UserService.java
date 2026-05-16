package com.decp.user_service.service;

import com.decp.user_service.dto.UpdateUserRequest;
import com.decp.user_service.dto.CreateUserRequest;
import com.decp.user_service.dto.UserProfileResponse;
import com.decp.user_service.entity.UserProfile;
import com.decp.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserProfileResponse createUser(CreateUserRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with email: " + request.getEmail());
        }

        UserProfile user = UserProfile.builder()
                .email(request.getEmail())
                .name(request.getName())
                .role(request.getRole() != null ? request.getRole() : "STUDENT")
                .build();

        return UserProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserProfileResponse getOrCreateUser(String email, String role) {
        return UserProfileResponse.from(getOrCreateUserProfile(email, role));
    }

    @Transactional
    public UserProfileResponse updateUser(String email, String role, UpdateUserRequest request) {
        UserProfile user = getOrCreateUserProfile(email, role);

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getUniversity() != null) {
            user.setUniversity(request.getUniversity());
        }
        if (request.getDegree() != null) {
            user.setDegree(request.getDegree());
        }
        if (request.getGraduationYear() != null) {
            validateGraduationYear(request.getGraduationYear());
            user.setGraduationYear(request.getGraduationYear());
        }
        if (request.getSkills() != null) {
            user.setSkills(new ArrayList<>(request.getSkills()));
        }
        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl());
        }
        if (request.getGithubUrl() != null) {
            user.setGithubUrl(request.getGithubUrl());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        return UserProfileResponse.from(userRepository.save(user));
    }

    public UserProfileResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserProfileResponse::from)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfile getOrCreateUserProfile(String email, String role) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(
                        UserProfile.builder()
                                .email(email)
                                .role(role != null ? role : "STUDENT")
                                .build()
                ));
    }

    private void validateGraduationYear(Integer graduationYear) {
        int maxGraduationYear = Year.now().getValue() + 10;
        if (graduationYear < 1900 || graduationYear > maxGraduationYear) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid graduation year: must be between 1900 and " + maxGraduationYear
            );
        }
    }
}
