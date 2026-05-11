package com.decp.notification_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
