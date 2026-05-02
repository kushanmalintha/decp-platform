package com.decp.job_service.dto;

import lombok.Data;

@Data
public class CreateJobRequest {
    private String title;
    private String description;
}
