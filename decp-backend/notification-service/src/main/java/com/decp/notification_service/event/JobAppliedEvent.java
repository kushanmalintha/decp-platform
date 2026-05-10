package com.decp.notification_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobAppliedEvent {

    private Long jobId;
    private String jobTitle;
    private String studentEmail;
    private String postedBy;
}
