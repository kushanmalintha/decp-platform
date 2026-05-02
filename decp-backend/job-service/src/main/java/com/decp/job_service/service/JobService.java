package com.decp.job_service.service;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.entity.*;
import com.decp.job_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;

    public Job createJob(String email, CreateJobRequest request) {
        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .postedByEmail(email)
                .createdAt(LocalDateTime.now())
                .build();

        return jobRepository.save(job);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public JobApplication apply(Long jobId, String email) {
        JobApplication app = JobApplication.builder()
                .jobId(jobId)
                .applicantEmail(email)
                .appliedAt(LocalDateTime.now())
                .build();

        return applicationRepository.save(app);
    }

    public List<JobApplication> getApplications(Long jobId) {
        return applicationRepository.findByJobId(jobId);
    }
}
