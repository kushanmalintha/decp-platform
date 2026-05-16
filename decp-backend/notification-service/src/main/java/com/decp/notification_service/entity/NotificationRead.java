package com.decp.notification_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notification_reads",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notification_reads_notification_user",
                columnNames = {"notification_id", "user_email"}
        ),
        indexes = {
                @Index(name = "idx_notification_reads_notification_id", columnList = "notification_id"),
                @Index(name = "idx_notification_reads_user_email", columnList = "user_email")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_id", nullable = false)
    private Long notificationId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    private LocalDateTime readAt;
}
