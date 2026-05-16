package com.decp.feed_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobClosedEvent {
    private Long jobId;
    private String title;
    private String postedByEmail;
    private LocalDateTime closedAt;
    private String status;
    private String companyName;
    private String location;
    private String jobType;
    private String workMode;
}
