package com.decp.job_service.service;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.entity.*;
import com.decp.job_service.event.JobCreatedEvent;
import com.decp.job_service.exception.EntityNotFoundException;
import com.decp.job_service.kafka.JobEventProducer;
import com.decp.job_service.mapper.JobMapper;
import com.decp.job_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobMapper jobMapper;
    private final JobEventProducer jobEventProducer;

    public JobResponse createJob(String email, CreateJobRequest request) {
        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .postedByEmail(email)
                .createdAt(LocalDateTime.now())
                .build();

        Job savedJob = jobRepository.save(job);

        // Publish event
        JobCreatedEvent event = JobCreatedEvent.builder()
                .jobId(savedJob.getId())
                .title(savedJob.getTitle())
                .postedBy(savedJob.getPostedByEmail())
                .build();

        jobEventProducer.sendJobCreatedEvent(event);

        return jobMapper.toJobResponse(savedJob);
    }

    public Page<JobResponse> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable)
                .map(jobMapper::toJobResponse);
    }

    public JobApplicationResponse apply(Long jobId, String email) {
        // Verify job exists
        if (!jobRepository.existsById(jobId)) {
            throw new EntityNotFoundException("Job not found with id: " + jobId);
        }

        JobApplication app = JobApplication.builder()
                .jobId(jobId)
                .applicantEmail(email)
                .appliedAt(LocalDateTime.now())
                .build();

        JobApplication savedApp = applicationRepository.save(app);
        return jobMapper.toJobApplicationResponse(savedApp);
    }

    public List<JobApplicationResponse> getApplications(Long jobId) {
        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(jobMapper::toJobApplicationResponse)
                .collect(Collectors.toList());
    }
}
