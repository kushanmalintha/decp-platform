package com.decp.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class NotificationResponse {

    private Long id;

    private String title;

    private String message;

    private String type;

    @JsonProperty("isRead")
    private boolean isRead;

    private OffsetDateTime createdAt;
}
