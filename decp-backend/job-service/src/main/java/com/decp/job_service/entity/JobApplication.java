package com.decp.job_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {

    public static final String STATUS_APPLIED = "APPLIED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "applicant_email")
    private String applicantEmail;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    private String status;

    @PrePersist
    public void prePersist() {
        if (appliedAt == null) {
            appliedAt = LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = STATUS_APPLIED;
        }
    }
}
