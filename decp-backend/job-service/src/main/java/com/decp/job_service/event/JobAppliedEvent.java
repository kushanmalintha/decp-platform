package com.decp.job_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobAppliedEvent {

    private Long jobId;
    private String jobTitle;
    private String studentEmail;
    private String postedBy;
}
