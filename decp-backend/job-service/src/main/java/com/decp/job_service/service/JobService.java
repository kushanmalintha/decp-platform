package com.decp.job_service.service;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.entity.*;
import com.decp.job_service.event.JobAppliedEvent;
import com.decp.job_service.event.JobCreatedEvent;
import com.decp.job_service.exception.DuplicateJobApplicationException;
import com.decp.job_service.exception.EntityNotFoundException;
import com.decp.job_service.exception.ForbiddenOperationException;
import com.decp.job_service.kafka.JobEventProducer;
import com.decp.job_service.mapper.JobApplicationMapper;
import com.decp.job_service.mapper.JobMapper;
import com.decp.job_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private static final String ROLE_STUDENT = "STUDENT";

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobMapper jobMapper;
    private final JobApplicationMapper jobApplicationMapper;
    private final JobEventProducer jobEventProducer;

    public JobResponse createJob(String email, CreateJobRequest request) {
        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .postedByEmail(email)
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

    public JobApplicationResponse applyForJob(Long jobId, String studentEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));

        if (applicationRepository.existsByJobIdAndApplicantEmail(jobId, studentEmail)) {
            throw new DuplicateJobApplicationException("Student already applied for job with id: " + jobId);
        }

        JobApplication app = JobApplication.builder()
                .jobId(jobId)
                .applicantEmail(studentEmail)
                .build();

        JobApplication savedApp = applicationRepository.save(app);

        JobAppliedEvent event = JobAppliedEvent.builder()
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .studentEmail(studentEmail)
                .postedBy(job.getPostedByEmail())
                .build();

        jobEventProducer.sendJobAppliedEvent(event);

        return jobApplicationMapper.toResponse(savedApp);
    }

    public JobApplicationResponse applyForJob(Long jobId, String studentEmail, String role) {
        validateStudentRole(role);
        return applyForJob(jobId, studentEmail);
    }

    public List<JobApplicationResponse> getApplications(Long jobId) {
        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(jobApplicationMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void validateStudentRole(String role) {
        if (role == null || !ROLE_STUDENT.equals(role.trim().toUpperCase())) {
            throw new ForbiddenOperationException("Only students can apply for jobs");
        }
    }
}
