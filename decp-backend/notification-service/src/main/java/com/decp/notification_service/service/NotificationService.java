package com.decp.notification_service.service;

import com.decp.notification_service.dto.NotificationResponse;
import com.decp.notification_service.dto.UnreadNotificationCountResponse;
import com.decp.notification_service.entity.Notification;
import com.decp.notification_service.entity.NotificationRead;
import com.decp.notification_service.event.ApplicationStatusUpdatedEvent;
import com.decp.notification_service.event.JobAppliedEvent;
import com.decp.notification_service.event.JobClosedEvent;
import com.decp.notification_service.event.JobCreatedEvent;
import com.decp.notification_service.mapper.NotificationMapper;
import com.decp.notification_service.repository.NotificationReadRepository;
import com.decp.notification_service.repository.NotificationRepository;
import org.springframework.dao.DataIntegrityViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String ROLE_STUDENT = "STUDENT";
    private static final String ROLE_ALUMNI = "ALUMNI";
    private static final String ROLE_RECRUITER = "RECRUITER";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String TYPE_JOB_CREATED = "JOB_CREATED";
    private static final String TYPE_JOB_CLOSED = "JOB_CLOSED";
    private static final String TYPE_JOB_APPLIED = "JOB_APPLIED";
    private static final String TYPE_APPLICATION_STATUS_UPDATED = "APPLICATION_STATUS_UPDATED";

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
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

    public Notification createJobClosedNotification(JobClosedEvent event) {
        String message = String.format("Job closed: %s", event.getTitle());

        Notification notification = Notification.builder()
                .jobId(event.getJobId())
                .title(event.getTitle())
                .message(message)
                .type(TYPE_JOB_CLOSED)
                .postedBy(event.getPostedByEmail())
                .recipientRole(ROLE_STUDENT)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }

    public Notification createApplicationStatusUpdatedNotification(ApplicationStatusUpdatedEvent event) {
        String message = buildApplicationStatusMessage(event.getJobTitle(), event.getStatus());

        Notification notification = Notification.builder()
                .jobId(event.getJobId())
                .title(event.getJobTitle())
                .message(message)
                .type(TYPE_APPLICATION_STATUS_UPDATED)
                .postedBy(event.getRecruiterEmail())
                .recipientEmail(event.getStudentEmail())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Saved application status notification notificationId={} applicationId={} jobId={} recipientEmail={} status={}",
                savedNotification.getId(),
                event.getApplicationId(),
                event.getJobId(),
                event.getStudentEmail(),
                event.getStatus());
        return savedNotification;
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
        String normalizedEmail = normalizeEmail(email);

        return notificationRepository.findForRecipient(email, normalizeRole(role), pageable)
                .map(notification -> notificationMapper.toResponse(
                        notification,
                        isReadByUser(notification.getId(), normalizedEmail)));
    }

    public List<NotificationResponse> getUnreadNotifications(String email, String role) {
        validateAuthenticatedUser(email, role);
        String normalizedEmail = normalizeEmail(email);

        List<Notification> visibleNotifications = notificationRepository.findAllForRecipient(email, normalizeRole(role));
        Set<Long> readNotificationIds = readNotificationIds(normalizedEmail, visibleNotifications);

        return visibleNotifications
                .stream()
                .filter(notification -> !readNotificationIds.contains(notification.getId()))
                .map(notification -> notificationMapper.toResponse(notification, false))
                .toList();
    }

    public UnreadNotificationCountResponse getUnreadCount(String email, String role) {
        validateAuthenticatedUser(email, role);

        String normalizedEmail = normalizeEmail(email);
        String normalizedRole = normalizeRole(role);
        log.info("Unread notification count requested userEmail={} userRole={}", email, normalizedRole);

        List<Notification> visibleNotifications = notificationRepository.findAllForRecipient(email, normalizedRole);
        Set<Long> readNotificationIds = readNotificationIds(normalizedEmail, visibleNotifications);
        long count = visibleNotifications.stream()
                .filter(notification -> !readNotificationIds.contains(notification.getId()))
                .count();

        log.info("Unread notification count returned userEmail={} userRole={} count={}", email, normalizedRole, count);
        return new UnreadNotificationCountResponse(count);
    }

    public NotificationResponse markAsRead(Long id, String email, String role) {
        validateAuthenticatedUser(email, role);
        String normalizedEmail = normalizeEmail(email);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!canAccessNotification(notification, email, normalizeRole(role))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update this notification");
        }

        markNotificationReadForUser(notification.getId(), normalizedEmail);
        return notificationMapper.toResponse(notification, true);
    }

    public List<NotificationResponse> markAllAsRead(String email, String role) {
        validateAuthenticatedUser(email, role);
        String normalizedEmail = normalizeEmail(email);

        List<Notification> notifications = notificationRepository.findAllForRecipient(email, normalizeRole(role));
        Set<Long> readNotificationIds = readNotificationIds(normalizedEmail, notifications);
        List<Notification> unreadNotifications = notifications.stream()
                .filter(notification -> !readNotificationIds.contains(notification.getId()))
                .toList();

        unreadNotifications.forEach(notification -> markNotificationReadForUser(notification.getId(), normalizedEmail));
        log.info("Marked all visible notifications read for userEmail={} count={}", normalizedEmail, unreadNotifications.size());

        return notifications
                .stream()
                .map(notification -> notificationMapper.toResponse(notification, true))
                .toList();
    }

    private boolean isReadByUser(Long notificationId, String userEmail) {
        return notificationReadRepository.existsByNotificationIdAndUserEmail(notificationId, userEmail);
    }

    private Set<Long> readNotificationIds(String userEmail, List<Notification> notifications) {
        List<Long> notificationIds = notifications.stream()
                .map(Notification::getId)
                .toList();

        if (notificationIds.isEmpty()) {
            return Set.of();
        }

        return notificationReadRepository.findByUserEmailAndNotificationIdIn(userEmail, notificationIds)
                .stream()
                .map(NotificationRead::getNotificationId)
                .collect(Collectors.toSet());
    }

    private void markNotificationReadForUser(Long notificationId, String userEmail) {
        if (notificationReadRepository.existsByNotificationIdAndUserEmail(notificationId, userEmail)) {
            return;
        }

        try {
            notificationReadRepository.save(NotificationRead.builder()
                    .notificationId(notificationId)
                    .userEmail(userEmail)
                    .readAt(LocalDateTime.now())
                    .build());
            log.info("Created notification read state notificationId={} userEmail={}", notificationId, userEmail);
        } catch (DataIntegrityViolationException ex) {
            log.info("Notification read state already exists notificationId={} userEmail={}", notificationId, userEmail);
        }
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
        return ROLE_STUDENT.equals(role)
                || ROLE_ALUMNI.equals(role)
                || ROLE_RECRUITER.equals(role)
                || ROLE_ADMIN.equals(role);
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String buildApplicationStatusMessage(String jobTitle, String status) {
        String normalizedStatus = normalizeStatus(status);

        return switch (normalizedStatus) {
            case "REVIEWING" -> String.format("Your application for %s is under review", jobTitle);
            case "SHORTLISTED" -> String.format("Your application for %s was shortlisted", jobTitle);
            case "ACCEPTED" -> String.format("Your application for %s was accepted", jobTitle);
            case "REJECTED" -> String.format("Your application for %s was rejected", jobTitle);
            default -> String.format("Your application for %s status changed to %s", jobTitle, normalizedStatus);
        };
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }
}
