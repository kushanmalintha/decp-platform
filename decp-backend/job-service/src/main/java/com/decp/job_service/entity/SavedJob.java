package com.decp.job_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "saved_jobs",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_saved_jobs_job_student",
                columnNames = {"job_id", "student_email"}
        ),
        indexes = {
                @Index(name = "idx_saved_jobs_job_id", columnList = "job_id"),
                @Index(name = "idx_saved_jobs_student_email", columnList = "student_email")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "student_email", nullable = false)
    private String studentEmail;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;

    @PrePersist
    public void prePersist() {
        if (savedAt == null) {
            savedAt = LocalDateTime.now();
        }
    }
}
