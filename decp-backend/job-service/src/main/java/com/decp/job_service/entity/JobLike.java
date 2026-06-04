package com.decp.job_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Clock;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "job_likes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_likes_job_user",
                columnNames = {"job_id", "user_email"}
        ),
        indexes = {
                @Index(name = "idx_job_likes_job_id", columnList = "job_id"),
                @Index(name = "idx_job_likes_user_email", columnList = "user_email")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(Clock.systemUTC());
        }
    }
}
