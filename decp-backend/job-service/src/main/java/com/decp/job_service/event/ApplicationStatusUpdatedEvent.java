package com.decp.job_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusUpdatedEvent {

    private Long applicationId;
    private Long jobId;
    private String studentEmail;
    private String recruiterEmail;
    private String status;
    private String jobTitle;
}
