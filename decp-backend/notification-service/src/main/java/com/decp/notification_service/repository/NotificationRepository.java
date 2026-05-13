package com.decp.notification_service.repository;

import com.decp.notification_service.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole, Pageable pageable);

    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);

    List<Notification> findByRecipientRoleAndReadFalseOrderByCreatedAtDesc(String recipientRole);

    @Query("""
            select n from Notification n
            where n.recipientEmail = :email
               or n.recipientRole = :role
            order by n.createdAt desc
            """)
    Page<Notification> findForRecipient(
            @Param("email") String email,
            @Param("role") String role,
            Pageable pageable);

    @Query("""
            select n from Notification n
            where n.read = false
              and (n.recipientEmail = :email or n.recipientRole = :role)
            order by n.createdAt desc
            """)
    List<Notification> findUnreadForRecipient(
            @Param("email") String email,
            @Param("role") String role);

    @Query("""
            select count(n) from Notification n
            where n.read = false
              and (n.recipientEmail = :email or n.recipientRole = :role)
            """)
    long countUnreadForRecipient(
            @Param("email") String email,
            @Param("role") String role);
}
