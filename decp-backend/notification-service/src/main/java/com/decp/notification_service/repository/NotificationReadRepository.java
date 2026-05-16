package com.decp.notification_service.repository;

import com.decp.notification_service.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {
    boolean existsByNotificationIdAndUserEmail(Long notificationId, String userEmail);

    Optional<NotificationRead> findByNotificationIdAndUserEmail(Long notificationId, String userEmail);

    List<NotificationRead> findByUserEmail(String userEmail);

    List<NotificationRead> findByUserEmailAndNotificationIdIn(String userEmail, Collection<Long> notificationIds);
}
