package com.decp.job_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private String postedByEmail;

    private String companyName;

    private String location;

    @Enumerated(EnumType.STRING)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    private WorkMode workMode;

    private String salaryRange;

    private LocalDate applicationDeadline;

    private String requirements;

    private String responsibilities;

    @ElementCollection
    @CollectionTable(name = "job_skills_required", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skillsRequired = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private JobStatus status = JobStatus.OPEN;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(Clock.systemUTC());
        }
        if (status == null) {
            status = JobStatus.OPEN;
        }
    }
}
