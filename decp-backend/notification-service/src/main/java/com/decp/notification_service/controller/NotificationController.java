package com.decp.notification_service.controller;

import com.decp.notification_service.entity.Notification;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> getNotifications(@RequestHeader("X-User-Role") String role) {
        return notificationService.getNotificationsForRole(role);
    }

    @GetMapping("/unread")
    public List<Notification> getUnreadNotifications(@RequestHeader("X-User-Role") String role) {
        return notificationService.getUnreadNotificationsForRole(role);
    }

    @PatchMapping("/{id}/read")
    public Notification markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        return notificationService.markAsRead(id, role);
    }

    @PatchMapping("/read-all")
    public List<Notification> markAllAsRead(@RequestHeader("X-User-Role") String role) {
        return notificationService.markAllAsRead(role);
    }
}
