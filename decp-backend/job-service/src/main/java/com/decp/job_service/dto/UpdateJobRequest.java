package com.decp.job_service.dto;

import com.decp.job_service.entity.ExperienceLevel;
import com.decp.job_service.entity.JobType;
import com.decp.job_service.entity.WorkMode;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateJobRequest {
    private String title;
    private String description;
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
}
