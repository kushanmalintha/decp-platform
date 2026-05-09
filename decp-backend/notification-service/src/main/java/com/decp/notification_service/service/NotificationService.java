package com.decp.notification_service.service;

import com.decp.notification_service.entity.Notification;
import com.decp.notification_service.event.JobCreatedEvent;
import com.decp.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String ROLE_STUDENT = "STUDENT";

    private final NotificationRepository notificationRepository;

    public Notification createJobPostedNotification(JobCreatedEvent event) {
        String message = String.format("New job posted: %s by %s",
                event.getTitle(),
                event.getPostedBy());

        Notification notification = Notification.builder()
                .jobId(event.getJobId())
                .title(event.getTitle())
                .message(message)
                .postedBy(event.getPostedBy())
                .recipientRole(ROLE_STUDENT)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForRole(String role) {
        validateStudentRole(role);

        return notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(ROLE_STUDENT);
    }

    public List<Notification> getUnreadNotificationsForRole(String role) {
        validateStudentRole(role);

        return notificationRepository.findByRecipientRoleAndReadFalseOrderByCreatedAtDesc(ROLE_STUDENT);
    }

    public Notification markAsRead(Long id, String role) {
        validateStudentRole(role);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!ROLE_STUDENT.equals(notification.getRecipientRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update this notification");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public List<Notification> markAllAsRead(String role) {
        validateStudentRole(role);

        List<Notification> notifications =
                notificationRepository.findByRecipientRoleAndReadFalseOrderByCreatedAtDesc(ROLE_STUDENT);

        notifications.forEach(notification -> notification.setRead(true));
        return notificationRepository.saveAll(notifications);
    }

    private void validateStudentRole(String role) {
        if (role == null || !ROLE_STUDENT.equals(role.trim().toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can view notifications");
        }
    }
}
