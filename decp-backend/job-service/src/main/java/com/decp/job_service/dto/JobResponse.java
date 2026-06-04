package com.decp.job_service.dto;

import com.decp.job_service.entity.ExperienceLevel;
import com.decp.job_service.entity.JobStatus;
import com.decp.job_service.entity.JobType;
import com.decp.job_service.entity.WorkMode;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String postedByEmail;
    private String companyName;
    private String location;
    private JobType jobType;
    private WorkMode workMode;
    private String salaryRange;
    private LocalDate applicationDeadline;
    private String requirements;
    private String responsibilities;
    private List<String> skillsRequired;
    private ExperienceLevel experienceLevel;
    private JobStatus status;
    private int likes;
    private boolean likedByCurrentUser;
    private OffsetDateTime createdAt;
}
