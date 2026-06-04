package com.decp.job_service.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobCommentRequest {
    private String content;
}
