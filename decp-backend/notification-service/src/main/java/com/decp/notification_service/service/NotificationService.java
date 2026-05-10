package com.decp.notification_service.service;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.entity.Notification;
import com.decp.notification_service.event.JobAppliedEvent;
import com.decp.notification_service.event.JobCreatedEvent;
import com.decp.notification_service.mapper.NotificationMapper;
import com.decp.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String ROLE_STUDENT = "STUDENT";
    private static final String ROLE_ALUMNI = "ALUMNI";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String TYPE_JOB_CREATED = "JOB_CREATED";
    private static final String TYPE_JOB_APPLIED = "JOB_APPLIED";

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public Notification createJobPostedNotification(JobCreatedEvent event) {
        String message = String.format("New job posted: %s by %s",
                event.getTitle(),
                event.getPostedBy());

        Notification notification = Notification.builder()
                .jobId(event.getJobId())
                .title(event.getTitle())
                .message(message)
                .type(TYPE_JOB_CREATED)
                .postedBy(event.getPostedBy())
                .recipientRole(ROLE_STUDENT)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }

    public Notification createJobAppliedNotification(JobAppliedEvent event) {
        String message = String.format("New application received for %s from %s",
                event.getJobTitle(),
                event.getStudentEmail());

        Notification notification = Notification.builder()
                .jobId(event.getJobId())
                .title(event.getJobTitle())
                .message(message)
                .type(TYPE_JOB_APPLIED)
                .postedBy(event.getPostedBy())
                .recipientEmail(event.getPostedBy())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }

    public Page<NotificationResponse> getNotifications(String email, String role, Pageable pageable) {
        validateAuthenticatedUser(email, role);

        return notificationRepository.findForRecipient(email, normalizeRole(role), pageable)
                .map(notificationMapper::toResponse);
    }

    public List<NotificationResponse> getUnreadNotifications(String email, String role) {
        validateAuthenticatedUser(email, role);

        return notificationRepository.findUnreadForRecipient(email, normalizeRole(role))
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    public NotificationResponse markAsRead(Long id, String email, String role) {
        validateAuthenticatedUser(email, role);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!canAccessNotification(notification, email, normalizeRole(role))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update this notification");
        }

        notification.setRead(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    public List<NotificationResponse> markAllAsRead(String email, String role) {
        validateAuthenticatedUser(email, role);

        List<Notification> notifications =
                notificationRepository.findUnreadForRecipient(email, normalizeRole(role));

        notifications.forEach(notification -> notification.setRead(true));
        return notificationRepository.saveAll(notifications)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    private void validateAuthenticatedUser(String email, String role) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user email");
        }
        if (!isKnownRole(normalizeRole(role))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid notification recipient role");
        }
    }

    private boolean canAccessNotification(Notification notification, String email, String role) {
        return email.equalsIgnoreCase(notification.getRecipientEmail())
                || role.equalsIgnoreCase(notification.getRecipientRole());
    }

    private boolean isKnownRole(String role) {
        return ROLE_STUDENT.equals(role) || ROLE_ALUMNI.equals(role) || ROLE_ADMIN.equals(role);
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }
}
