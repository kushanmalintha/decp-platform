package com.decp.job_service.service;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.dto.UpdateApplicationStatusRequest;
import com.decp.job_service.entity.*;
import com.decp.job_service.event.ApplicationStatusUpdatedEvent;
import com.decp.job_service.event.JobAppliedEvent;
import com.decp.job_service.event.JobCreatedEvent;
import com.decp.job_service.exception.DuplicateJobApplicationException;
import com.decp.job_service.exception.EntityNotFoundException;
import com.decp.job_service.exception.ForbiddenOperationException;
import com.decp.job_service.exception.InvalidApplicationStatusTransitionException;
import com.decp.job_service.kafka.JobEventProducer;
import com.decp.job_service.mapper.JobApplicationMapper;
import com.decp.job_service.mapper.JobMapper;
import com.decp.job_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private static final String ROLE_STUDENT = "STUDENT";
    private static final String ROLE_RECRUITER = "RECRUITER";
    private static final String ROLE_ALUMNI = "ALUMNI";

    private static final Map<ApplicationStatus, EnumSet<ApplicationStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(ApplicationStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(ApplicationStatus.APPLIED, EnumSet.of(ApplicationStatus.REVIEWING));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.REVIEWING,
                EnumSet.of(ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.SHORTLISTED,
                EnumSet.of(ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.REJECTED, EnumSet.noneOf(ApplicationStatus.class));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.ACCEPTED, EnumSet.noneOf(ApplicationStatus.class));
    }

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

    public Page<JobResponse> getAllJobs(String keyword, JobStatus status, String postedByEmail, Pageable pageable) {
        if (isBlank(keyword) && status == null && isBlank(postedByEmail)) {
            return getAllJobs(pageable);
        }

        log.info("Retrieving jobs keyword={} status={} postedByEmail={}", keyword, status, postedByEmail);
        return jobRepository.findAll(JobSpecifications.withFilters(keyword, status, postedByEmail), pageable)
                .map(jobMapper::toJobResponse);
    }

    public JobApplicationResponse applyForJob(Long jobId, String studentEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));

        if (applicationRepository.existsByJobIdAndStudentEmail(jobId, studentEmail)) {
            throw new DuplicateJobApplicationException("Student already applied for job with id: " + jobId);
        }

        JobApplication app = JobApplication.builder()
                .jobId(jobId)
                .studentEmail(studentEmail)
                .status(ApplicationStatus.APPLIED)
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

    public List<JobApplicationResponse> getApplicationsForJob(Long jobId, String recruiterEmail, String role) {
        validateRecruiterRole(role);
        Job job = findJob(jobId);
        validateJobOwnership(job, recruiterEmail);

        log.info("Retrieving applications jobId={} recruiterEmail={}", jobId, recruiterEmail);
        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(jobApplicationMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<JobApplicationResponse> getMyApplications(String studentEmail, String role) {
        validateStudentRole(role);

        log.info("Retrieving student application history studentEmail={}", studentEmail);
        return applicationRepository.findByStudentEmailOrderByAppliedAtDesc(studentEmail)
                .stream()
                .map(jobApplicationMapper::toResponse)
                .toList();
    }

    @Transactional
    public JobApplicationResponse updateApplicationStatus(
            Long applicationId,
            String recruiterEmail,
            String role,
            UpdateApplicationStatusRequest request) {

        validateRecruiterRole(role);
        if (request == null || request.getStatus() == null) {
            throw new InvalidApplicationStatusTransitionException("Application status is required");
        }

        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found with id: " + applicationId));
        Job job = findJob(application.getJobId());
        validateJobOwnership(job, recruiterEmail);
        validateStatusTransition(application.getStatus(), request.getStatus());

        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(request.getStatus());
        JobApplication savedApplication = applicationRepository.save(application);

        log.info("Updated application status applicationId={} jobId={} recruiterEmail={} fromStatus={} toStatus={}",
                savedApplication.getId(),
                savedApplication.getJobId(),
                recruiterEmail,
                previousStatus,
                savedApplication.getStatus());

        ApplicationStatusUpdatedEvent event = ApplicationStatusUpdatedEvent.builder()
                .applicationId(savedApplication.getId())
                .jobId(job.getId())
                .studentEmail(savedApplication.getStudentEmail())
                .recruiterEmail(recruiterEmail)
                .status(savedApplication.getStatus().name())
                .jobTitle(job.getTitle())
                .build();

        jobEventProducer.sendApplicationStatusUpdatedEvent(event);

        return jobApplicationMapper.toResponse(savedApplication);
    }

    private void validateStudentRole(String role) {
        if (role == null || !ROLE_STUDENT.equals(role.trim().toUpperCase())) {
            throw new ForbiddenOperationException("Only students can apply for jobs");
        }
    }

    private void validateRecruiterRole(String role) {
        String normalizedRole = normalizeRole(role);
        if (!ROLE_RECRUITER.equals(normalizedRole) && !ROLE_ALUMNI.equals(normalizedRole)) {
            throw new ForbiddenOperationException("Only recruiters can manage applications");
        }
    }

    private void validateJobOwnership(Job job, String recruiterEmail) {
        if (recruiterEmail == null || !recruiterEmail.equalsIgnoreCase(job.getPostedByEmail())) {
            throw new ForbiddenOperationException("Cannot manage applications for another recruiter's job");
        }
    }

    private void validateStatusTransition(ApplicationStatus currentStatus, ApplicationStatus nextStatus) {
        if (currentStatus == null) {
            currentStatus = ApplicationStatus.APPLIED;
        }

        if (currentStatus == nextStatus) {
            throw new InvalidApplicationStatusTransitionException(
                    "Application is already in status: " + currentStatus);
        }

        if (!ALLOWED_TRANSITIONS.getOrDefault(currentStatus, EnumSet.noneOf(ApplicationStatus.class))
                .contains(nextStatus)) {
            throw new InvalidApplicationStatusTransitionException(
                    "Invalid application status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private Job findJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + jobId));
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
