package com.decp.feed_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobUpdatedEvent {
    private Long jobId;
    private String title;
    private String postedBy;
    private String description;
    private String companyName;
    private String location;
    private String jobType;
    private String workMode;
    private String salaryRange;
    private LocalDate applicationDeadline;
    private String requirements;
    private String responsibilities;
    private List<String> skillsRequired;
    private String experienceLevel;
    private String status;
}
