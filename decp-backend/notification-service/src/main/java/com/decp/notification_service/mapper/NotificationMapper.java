package com.decp.notification_service.mapper;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.entity.Notification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        return toResponse(notification, notification.isRead());
    }

    public NotificationResponse toResponse(Notification notification, boolean isRead) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(isRead)
                .createdAt(toUtcOffsetDateTime(notification.getCreatedAt()))
                .build();
    }

    private OffsetDateTime toUtcOffsetDateTime(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }
}
