package com.decp.job_service.repository;

import com.decp.job_service.entity.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    boolean existsByJobIdAndStudentEmail(Long jobId, String studentEmail);

    Optional<SavedJob> findByJobIdAndStudentEmail(Long jobId, String studentEmail);

    List<SavedJob> findByStudentEmailOrderBySavedAtDesc(String studentEmail);

    Page<SavedJob> findByStudentEmailOrderBySavedAtDesc(String studentEmail, Pageable pageable);

    void deleteByJobIdAndStudentEmail(Long jobId, String studentEmail);
}
