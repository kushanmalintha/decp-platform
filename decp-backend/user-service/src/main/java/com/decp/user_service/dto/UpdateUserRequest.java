package com.decp.user_service.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateUserRequest {
    private String name;
    private String bio;
    private String university;
    private String degree;
    private Integer graduationYear;
    private List<String> skills;
    private String linkedinUrl;
    private String githubUrl;
    private String profileImageUrl;
}
