package com.decp.notification_service.repository;

import com.decp.notification_service.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole, Pageable pageable);

    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);

    List<Notification> findByRecipientRoleAndReadFalseOrderByCreatedAtDesc(String recipientRole);
}
