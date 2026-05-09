package com.decp.notification_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobCreatedEvent {
    private Long jobId;
    private String title;
    private String postedBy;
}
