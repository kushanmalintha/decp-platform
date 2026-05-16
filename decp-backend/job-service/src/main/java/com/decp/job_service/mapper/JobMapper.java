package com.decp.job_service.mapper;

import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.entity.Job;
import com.decp.job_service.entity.JobStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class JobMapper {

    public JobResponse toJobResponse(Job job) {
        if (job == null) {
            return null;
        }

        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .postedByEmail(job.getPostedByEmail())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .jobType(job.getJobType())
                .workMode(job.getWorkMode())
                .salaryRange(job.getSalaryRange())
                .applicationDeadline(job.getApplicationDeadline())
                .requirements(job.getRequirements())
                .responsibilities(job.getResponsibilities())
                .skillsRequired(job.getSkillsRequired() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(job.getSkillsRequired()))
                .experienceLevel(job.getExperienceLevel())
                .status(job.getStatus() == null ? JobStatus.OPEN : job.getStatus())
                .createdAt(job.getCreatedAt())
                .build();
    }

}
