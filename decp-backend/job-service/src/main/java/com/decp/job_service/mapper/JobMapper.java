package com.decp.job_service.mapper;

import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.dto.JobCommentResponse;
import com.decp.job_service.entity.Job;
import com.decp.job_service.entity.JobComment;
import com.decp.job_service.entity.JobStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;

@Component
public class JobMapper {

    public JobResponse toJobResponse(Job job) {
        return toJobResponse(job, false, 0, 0);
    }

    public JobResponse toJobResponse(Job job, boolean likedByCurrentUser) {
        return toJobResponse(job, likedByCurrentUser, 0, 0);
    }

    public JobResponse toJobResponse(Job job, boolean likedByCurrentUser, long likes) {
        return toJobResponse(job, likedByCurrentUser, likes, 0);
    }

    public JobResponse toJobResponse(Job job, boolean likedByCurrentUser, long likes, long commentCount) {
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
                .likes(Math.toIntExact(likes))
                .commentCount(Math.toIntExact(commentCount))
                .likedByCurrentUser(likedByCurrentUser)
                .createdAt(toUtcOffsetDateTime(job.getCreatedAt()))
                .build();
    }

    public JobCommentResponse toJobCommentResponse(JobComment comment) {
        if (comment == null) {
            return null;
        }

        return JobCommentResponse.builder()
                .id(comment.getId())
                .jobId(comment.getJobId())
                .authorEmail(comment.getAuthorEmail())
                .content(comment.getContent())
                .createdAt(toUtcOffsetDateTime(comment.getCreatedAt()))
                .build();
    }

    private OffsetDateTime toUtcOffsetDateTime(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }
}
