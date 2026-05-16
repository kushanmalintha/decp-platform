package com.decp.notification_service.mapper;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.entity.Notification;
import org.springframework.stereotype.Component;

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
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
