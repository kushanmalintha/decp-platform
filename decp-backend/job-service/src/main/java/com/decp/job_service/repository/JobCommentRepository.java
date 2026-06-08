package com.decp.job_service.repository;

import com.decp.job_service.entity.JobComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobCommentRepository extends JpaRepository<JobComment, Long> {
    List<JobComment> findByJobIdOrderByCreatedAtAsc(Long jobId);
    long countByJobId(Long jobId);
}
