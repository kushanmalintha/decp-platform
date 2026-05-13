package com.decp.job_service.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruiterDashboardResponse {

    private long jobsPosted;
    private long openJobs;
    private long closedJobs;
    private long totalApplications;
    private long applied;
    private long reviewing;
    private long shortlisted;
    private long accepted;
    private long rejected;
}
