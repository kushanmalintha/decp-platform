package com.decp.notification_service.controller;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.security.JwtUtil;
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
    private final JwtUtil jwtUtil;

    @GetMapping
    public Page<NotificationResponse> getNotifications(
            @RequestHeader("Authorization") String authHeader,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return notificationService.getNotifications(user.email(), user.role(), pageable);
    }

    @GetMapping("/unread")
    public List<NotificationResponse> getUnreadNotifications(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return notificationService.getUnreadNotifications(user.email(), user.role());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return notificationService.markAsRead(id, user.email(), user.role());
    }

    @PatchMapping("/read-all")
    public List<NotificationResponse> markAllAsRead(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return notificationService.markAllAsRead(user.email(), user.role());
    }
}
