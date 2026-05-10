package com.decp.notification_service.controller;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
    public Page<NotificationResponse> getNotifications(
            @RequestHeader("X-User-Email") String email,
            @RequestHeader("X-User-Role") String role,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return notificationService.getNotifications(email, role, pageable);
    }

    @GetMapping("/unread")
    public List<NotificationResponse> getUnreadNotifications(
            @RequestHeader("X-User-Email") String email,
            @RequestHeader("X-User-Role") String role) {
        return notificationService.getUnreadNotifications(email, role);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String email,
            @RequestHeader("X-User-Role") String role) {

        return notificationService.markAsRead(id, email, role);
    }

    @PatchMapping("/read-all")
    public List<NotificationResponse> markAllAsRead(
            @RequestHeader("X-User-Email") String email,
            @RequestHeader("X-User-Role") String role) {
        return notificationService.markAllAsRead(email, role);
    }
}
