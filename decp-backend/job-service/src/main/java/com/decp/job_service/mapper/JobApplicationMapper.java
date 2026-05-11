package com.decp.job_service.mapper;

import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.entity.JobApplication;
import org.springframework.stereotype.Component;

@Component
public class JobApplicationMapper {

    public JobApplicationResponse toResponse(JobApplication jobApplication) {
        if (jobApplication == null) {
            return null;
        }

        return JobApplicationResponse.builder()
                .id(jobApplication.getId())
                .jobId(jobApplication.getJobId())
                .studentEmail(jobApplication.getStudentEmail())
                .applicantEmail(jobApplication.getStudentEmail())
                .appliedAt(jobApplication.getAppliedAt())
                .status(jobApplication.getStatus() == null ? null : jobApplication.getStatus().name())
                .build();
    }
}
