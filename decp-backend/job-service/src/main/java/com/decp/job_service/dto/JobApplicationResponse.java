package com.decp.job_service.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplicationResponse {

    private Long id;
    private Long jobId;
    private String studentEmail;
    private String applicantEmail;
    private OffsetDateTime appliedAt;
    private String status;
}
