package com.decp.job_service.dto;

import com.decp.job_service.entity.JobStatus;
import lombok.*;

import java.time.LocalDateTime;

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
    private JobStatus status;
    private LocalDateTime createdAt;
}
