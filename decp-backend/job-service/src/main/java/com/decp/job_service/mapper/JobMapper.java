package com.decp.job_service.mapper;

import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.entity.Job;
import org.springframework.stereotype.Component;

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
                .createdAt(job.getCreatedAt())
                .build();
    }

}
