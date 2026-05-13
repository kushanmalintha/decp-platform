package com.decp.job_service.repository;

import com.decp.job_service.entity.Job;
import com.decp.job_service.entity.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    long countByPostedByEmail(String postedByEmail);

    long countByPostedByEmailAndStatus(String postedByEmail, JobStatus status);

    List<Job> findByPostedByEmail(String postedByEmail);
}
