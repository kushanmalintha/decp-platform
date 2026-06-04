package com.decp.job_service.repository;

import com.decp.job_service.entity.JobLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobLikeRepository extends JpaRepository<JobLike, Long> {
    Optional<JobLike> findByJobIdAndUserEmailIgnoreCase(Long jobId, String userEmail);
    boolean existsByJobIdAndUserEmailIgnoreCase(Long jobId, String userEmail);
    long countByJobId(Long jobId);
}
