package com.decp.job_service.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplicationResponse {

    private Long id;
    private Long jobId;
    private String applicantEmail;
    private LocalDateTime appliedAt;
}
