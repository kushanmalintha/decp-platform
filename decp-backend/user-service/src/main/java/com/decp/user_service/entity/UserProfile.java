package com.decp.user_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    private String role;

    private String bio;

    private String university;

    private String degree;

    private Integer graduationYear;

    @ElementCollection
    @CollectionTable(name = "user_profile_skills", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    private String linkedinUrl;

    private String githubUrl;

    private String profileImageUrl;
}
