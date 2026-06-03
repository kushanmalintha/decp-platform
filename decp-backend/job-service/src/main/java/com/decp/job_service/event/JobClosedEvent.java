package com.decp.job_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobClosedEvent {
    private Long jobId;
    private String title;
    private String postedByEmail;
    private OffsetDateTime closedAt;
    private String status;
    private String companyName;
    private String location;
    private String jobType;
    private String workMode;
}
