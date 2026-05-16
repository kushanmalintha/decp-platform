package com.decp.user_service.dto;

import com.decp.user_service.entity.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String bio;
    private String university;
    private String degree;
    private Integer graduationYear;
    private List<String> skills;
    private String linkedinUrl;
    private String githubUrl;
    private String profileImageUrl;

    public static UserProfileResponse from(UserProfile user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getBio(),
                user.getUniversity(),
                user.getDegree(),
                user.getGraduationYear(),
                user.getSkills() == null ? new ArrayList<>() : new ArrayList<>(user.getSkills()),
                user.getLinkedinUrl(),
                user.getGithubUrl(),
                user.getProfileImageUrl()
        );
    }
}
