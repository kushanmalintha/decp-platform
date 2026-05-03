package com.decp.feed_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCreatedEvent {
    private Long jobId;
    private String title;
    private String postedBy;
}
