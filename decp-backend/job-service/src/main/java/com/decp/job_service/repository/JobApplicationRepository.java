package com.decp.job_service.repository;

import com.decp.job_service.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    boolean existsByJobIdAndApplicantEmail(Long jobId, String applicantEmail);

    List<JobApplication> findByJobId(Long jobId);
}
