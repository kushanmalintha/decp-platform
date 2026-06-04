package com.decp.job_service.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCommentResponse {
    private Long id;
    private Long jobId;
    private String authorEmail;
    private String content;
    private OffsetDateTime createdAt;
}
