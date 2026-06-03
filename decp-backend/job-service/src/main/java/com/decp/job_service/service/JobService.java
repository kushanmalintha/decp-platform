package com.decp.job_service.service;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.dto.RecruiterDashboardResponse;
import com.decp.job_service.dto.UpdateApplicationStatusRequest;
import com.decp.job_service.dto.UpdateJobRequest;
import com.decp.job_service.entity.*;
import com.decp.job_service.event.ApplicationStatusUpdatedEvent;
import com.decp.job_service.event.JobAppliedEvent;
import com.decp.job_service.event.JobClosedEvent;
import com.decp.job_service.event.JobCreatedEvent;
import com.decp.job_service.event.JobUpdatedEvent;
import com.decp.job_service.exception.DuplicateJobApplicationException;
import com.decp.job_service.exception.DuplicateSavedJobException;
import com.decp.job_service.exception.EntityNotFoundException;
import com.decp.job_service.exception.ForbiddenOperationException;
import com.decp.job_service.exception.InvalidApplicationStatusTransitionException;
import com.decp.job_service.exception.InvalidJobOperationException;
import com.decp.job_service.kafka.JobEventProducer;
import com.decp.job_service.mapper.JobApplicationMapper;
import com.decp.job_service.mapper.JobMapper;
import com.decp.job_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
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
    private static final String ROLE_ADMIN = "ADMIN";

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
    private final SavedJobRepository savedJobRepository;
    private final JobMapper jobMapper;
    private final JobApplicationMapper jobApplicationMapper;
    private final JobEventProducer jobEventProducer;

    @Transactional
    public JobResponse createJob(String email, String role, CreateJobRequest request) {
        validateCanCreateJob(email, role);
        validateCreateJobRequest(request);

        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .postedByEmail(email)
                .companyName(request.getCompanyName())
                .location(request.getLocation())
                .jobType(request.getJobType())
                .workMode(request.getWorkMode())
                .salaryRange(request.getSalaryRange())
                .applicationDeadline(request.getApplicationDeadline())
                .requirements(request.getRequirements())
                .responsibilities(request.getResponsibilities())
                .skillsRequired(request.getSkillsRequired() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(request.getSkillsRequired()))
                .experienceLevel(request.getExperienceLevel())
                .build();

        Job savedJob = jobRepository.save(job);

        jobEventProducer.sendJobCreatedEvent(toJobCreatedEvent(savedJob));

        return jobMapper.toJobResponse(savedJob);
    }

    @Transactional
    public JobResponse updateJob(Long jobId, String requesterEmail, String requesterRole, UpdateJobRequest request) {
        log.info("Job update requested jobId={} requesterEmail={} requesterRole={}",
                jobId, requesterEmail, normalizeRole(requesterRole));

        validateUpdateJobRequest(request);
        Job job = findJob(jobId);
        validateCanUpdateJob(job, requesterEmail, requesterRole);

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCompanyName(request.getCompanyName());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setWorkMode(request.getWorkMode());
        job.setSalaryRange(request.getSalaryRange());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setRequirements(request.getRequirements());
        job.setResponsibilities(request.getResponsibilities());
        job.setSkillsRequired(new ArrayList<>(request.getSkillsRequired()));
        job.setExperienceLevel(request.getExperienceLevel());

        Job savedJob = jobRepository.save(job);
        jobEventProducer.sendJobUpdatedEvent(toJobUpdatedEvent(savedJob));

        log.info("Job updated successfully jobId={} requesterEmail={} postedByEmail={}",
                savedJob.getId(), requesterEmail, savedJob.getPostedByEmail());
        return jobMapper.toJobResponse(savedJob);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable)
                .map(jobMapper::toJobResponse);
    }

    @Transactional(readOnly = true)
    public JobResponse getJobById(Long jobId) {
        return jobMapper.toJobResponse(findJob(jobId));
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> getAllJobs(
            String keyword,
            JobStatus status,
            String postedByEmail,
            JobType jobType,
            WorkMode workMode,
            String location,
            ExperienceLevel experienceLevel,
            Pageable pageable) {
        if (isBlank(keyword)
                && status == null
                && isBlank(postedByEmail)
                && jobType == null
                && workMode == null
                && isBlank(location)
                && experienceLevel == null) {
            return getAllJobs(pageable);
        }

        log.info(
                "Retrieving jobs keyword={} status={} postedByEmail={} jobType={} workMode={} location={} experienceLevel={}",
                keyword, status, postedByEmail, jobType, workMode, location, experienceLevel);
        return jobRepository.findAll(
                        JobSpecifications.withFilters(
                                keyword, status, postedByEmail, jobType, workMode, location, experienceLevel),
                        pageable)
                .map(jobMapper::toJobResponse);
    }

    @Transactional
    public JobResponse saveJob(Long jobId, String studentEmail, String role) {
        log.info("Saved job requested jobId={} studentEmail={} requesterRole={}",
                jobId, studentEmail, normalizeRole(role));

        validateSavedJobStudentRole(role);
        Job job = findJob(jobId);

        if (savedJobRepository.existsByJobIdAndStudentEmail(jobId, studentEmail)) {
            log.info("Duplicate saved job rejected jobId={} studentEmail={}", jobId, studentEmail);
            throw new DuplicateSavedJobException("Job is already saved with id: " + jobId);
        }

        SavedJob savedJob = SavedJob.builder()
                .jobId(job.getId())
                .studentEmail(studentEmail)
                .build();

        try {
            savedJobRepository.saveAndFlush(savedJob);
        } catch (DataIntegrityViolationException ex) {
            log.info("Duplicate saved job rejected by database jobId={} studentEmail={}", jobId, studentEmail);
            throw new DuplicateSavedJobException("Job is already saved with id: " + jobId);
        }

        log.info("Job saved successfully jobId={} studentEmail={}", jobId, studentEmail);
        return jobMapper.toJobResponse(job);
    }

    @Transactional
    public void unsaveJob(Long jobId, String studentEmail, String role) {
        log.info("Unsave job requested jobId={} studentEmail={} requesterRole={}",
                jobId, studentEmail, normalizeRole(role));

        validateSavedJobStudentRole(role);
        findJob(jobId);

        if (savedJobRepository.existsByJobIdAndStudentEmail(jobId, studentEmail)) {
            savedJobRepository.deleteByJobIdAndStudentEmail(jobId, studentEmail);
            log.info("Job unsaved successfully jobId={} studentEmail={}", jobId, studentEmail);
            return;
        }

        log.info("Unsave job requested for unsaved job jobId={} studentEmail={}", jobId, studentEmail);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> getSavedJobs(String studentEmail, String role, Pageable pageable) {
        validateSavedJobStudentRole(role);

        log.info("Retrieving saved jobs studentEmail={} page={} size={}",
                studentEmail, pageable.getPageNumber(), pageable.getPageSize());
        Page<JobResponse> savedJobs = savedJobRepository.findByStudentEmailOrderBySavedAtDesc(studentEmail, pageable)
                .map(savedJob -> jobMapper.toJobResponse(findJob(savedJob.getJobId())));

        log.info("Saved jobs retrieved studentEmail={} count={} total={}",
                studentEmail, savedJobs.getNumberOfElements(), savedJobs.getTotalElements());
        return savedJobs;
    }

    @Transactional
    public JobResponse closeJob(Long jobId, String requesterEmail, String requesterRole) {
        log.info("Job close requested jobId={} requesterEmail={} requesterRole={}",
                jobId, requesterEmail, normalizeRole(requesterRole));

        Job job = findJob(jobId);
        validateCanCloseJob(job, requesterEmail, requesterRole);

        if (job.getStatus() == JobStatus.CLOSED) {
            log.info("Job close requested for already closed job jobId={} requesterEmail={}", jobId, requesterEmail);
            return jobMapper.toJobResponse(job);
        }

        job.setStatus(JobStatus.CLOSED);
        Job savedJob = jobRepository.save(job);
        JobClosedEvent event = JobClosedEvent.builder()
                .jobId(savedJob.getId())
                .title(savedJob.getTitle())
                .postedByEmail(savedJob.getPostedByEmail())
                .closedAt(OffsetDateTime.now(Clock.systemUTC()))
                .status(savedJob.getStatus().name())
                .companyName(savedJob.getCompanyName())
                .location(savedJob.getLocation())
                .jobType(savedJob.getJobType() == null ? null : savedJob.getJobType().name())
                .workMode(savedJob.getWorkMode() == null ? null : savedJob.getWorkMode().name())
                .build();
        jobEventProducer.sendJobClosedEvent(event);

        log.info("Job closed successfully jobId={} requesterEmail={} postedByEmail={}",
                savedJob.getId(), requesterEmail, savedJob.getPostedByEmail());
        return jobMapper.toJobResponse(savedJob);
    }

    public JobApplicationResponse applyForJob(Long jobId, String studentEmail) {
        Job job = findJob(jobId);
        return createApplication(job, studentEmail);
    }

    public JobApplicationResponse applyForJob(Long jobId, String studentEmail, String role) {
        Job job = findJob(jobId);
        validateStudentRole(role);
        return createApplication(job, studentEmail);
    }

    private JobApplicationResponse createApplication(Job job, String studentEmail) {
        validateJobOpenForApplications(job, studentEmail);

        if (applicationRepository.existsByJobIdAndStudentEmail(job.getId(), studentEmail)) {
            throw new DuplicateJobApplicationException("Student already applied for job with id: " + job.getId());
        }

        JobApplication app = JobApplication.builder()
                .jobId(job.getId())
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

    @Transactional(readOnly = true)
    public RecruiterDashboardResponse getRecruiterDashboard(String requesterEmail, String requesterRole) {
        String normalizedRole = normalizeRole(requesterRole);
        log.info("Recruiter dashboard requested requesterEmail={} requesterRole={}", requesterEmail, normalizedRole);

        validateDashboardRole(requesterEmail, normalizedRole);

        long jobsPosted = jobRepository.countByPostedByEmail(requesterEmail);
        long closedJobs = jobRepository.countByPostedByEmailAndStatus(requesterEmail, JobStatus.CLOSED);
        long openJobs = jobsPosted - closedJobs;

        List<Long> jobIds = jobRepository.findByPostedByEmail(requesterEmail)
                .stream()
                .map(Job::getId)
                .toList();

        long totalApplications = 0;
        long applied = 0;
        long reviewing = 0;
        long shortlisted = 0;
        long accepted = 0;
        long rejected = 0;

        if (!jobIds.isEmpty()) {
            totalApplications = applicationRepository.countByJobIdIn(jobIds);
            applied = applicationRepository.countByJobIdInAndStatus(jobIds, ApplicationStatus.APPLIED);
            reviewing = applicationRepository.countByJobIdInAndStatus(jobIds, ApplicationStatus.REVIEWING);
            shortlisted = applicationRepository.countByJobIdInAndStatus(jobIds, ApplicationStatus.SHORTLISTED);
            accepted = applicationRepository.countByJobIdInAndStatus(jobIds, ApplicationStatus.ACCEPTED);
            rejected = applicationRepository.countByJobIdInAndStatus(jobIds, ApplicationStatus.REJECTED);
        }

        RecruiterDashboardResponse response = RecruiterDashboardResponse.builder()
                .jobsPosted(jobsPosted)
                .openJobs(openJobs)
                .closedJobs(closedJobs)
                .totalApplications(totalApplications)
                .applied(applied)
                .reviewing(reviewing)
                .shortlisted(shortlisted)
                .accepted(accepted)
                .rejected(rejected)
                .build();

        log.info("Recruiter dashboard generated requesterEmail={} jobsPosted={} totalApplications={}",
                requesterEmail, response.getJobsPosted(), response.getTotalApplications());
        return response;
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
        validateStudentRole(role, "Only students can apply for jobs");
    }

    private void validateCanCreateJob(String requesterEmail, String role) {
        String normalizedRole = normalizeRole(role);
        if (ROLE_ALUMNI.equals(normalizedRole) || ROLE_RECRUITER.equals(normalizedRole) || ROLE_ADMIN.equals(normalizedRole)) {
            return;
        }

        log.warn("Rejected job creation requesterEmail={} requesterRole={} reason=insufficient_role",
                requesterEmail,
                normalizedRole);
        throw new ForbiddenOperationException("Only alumni, recruiters, or admins can create jobs");
    }

    private void validateCreateJobRequest(CreateJobRequest request) {
        if (request == null) {
            throw new InvalidJobOperationException("Job request is required");
        }

        requireText(request.getTitle(), "title");
        requireText(request.getDescription(), "description");
        requireText(request.getCompanyName(), "companyName");
        requireText(request.getLocation(), "location");
        requireValue(request.getJobType(), "jobType");
        requireValue(request.getWorkMode(), "workMode");
        requireText(request.getSalaryRange(), "salaryRange");
        requireValue(request.getApplicationDeadline(), "applicationDeadline");
        requireText(request.getRequirements(), "requirements");
        requireText(request.getResponsibilities(), "responsibilities");
        requireValue(request.getExperienceLevel(), "experienceLevel");

        if (request.getSkillsRequired() == null || request.getSkillsRequired().isEmpty()) {
            throw new InvalidJobOperationException("skillsRequired is required");
        }

        boolean hasBlankSkill = request.getSkillsRequired().stream().anyMatch(this::isBlank);
        if (hasBlankSkill) {
            throw new InvalidJobOperationException("skillsRequired must not contain blank values");
        }
    }

    private void validateUpdateJobRequest(UpdateJobRequest request) {
        if (request == null) {
            throw new InvalidJobOperationException("Job update request is required");
        }

        requireText(request.getTitle(), "title");
        requireText(request.getDescription(), "description");
        requireText(request.getCompanyName(), "companyName");
        requireText(request.getLocation(), "location");
        requireValue(request.getJobType(), "jobType");
        requireValue(request.getWorkMode(), "workMode");
        requireText(request.getSalaryRange(), "salaryRange");
        requireValue(request.getApplicationDeadline(), "applicationDeadline");
        requireText(request.getRequirements(), "requirements");
        requireText(request.getResponsibilities(), "responsibilities");
        requireValue(request.getExperienceLevel(), "experienceLevel");

        if (request.getSkillsRequired() == null || request.getSkillsRequired().isEmpty()) {
            throw new InvalidJobOperationException("skillsRequired is required");
        }

        boolean hasBlankSkill = request.getSkillsRequired().stream().anyMatch(this::isBlank);
        if (hasBlankSkill) {
            throw new InvalidJobOperationException("skillsRequired must not contain blank values");
        }
    }

    private void requireText(String value, String fieldName) {
        if (isBlank(value)) {
            throw new InvalidJobOperationException(fieldName + " is required");
        }
    }

    private void requireValue(Object value, String fieldName) {
        if (value == null) {
            throw new InvalidJobOperationException(fieldName + " is required");
        }
    }

    private void validateSavedJobStudentRole(String role) {
        validateStudentRole(role, "Only students can use saved jobs");
    }

    private void validateStudentRole(String role, String message) {
        if (!ROLE_STUDENT.equals(normalizeRole(role))) {
            throw new ForbiddenOperationException(message);
        }
    }

    private void validateRecruiterRole(String role) {
        String normalizedRole = normalizeRole(role);
        if (!ROLE_RECRUITER.equals(normalizedRole) && !ROLE_ALUMNI.equals(normalizedRole)) {
            throw new ForbiddenOperationException("Only recruiters can manage applications");
        }
    }

    private void validateDashboardRole(String requesterEmail, String normalizedRole) {
        if (!ROLE_RECRUITER.equals(normalizedRole) && !ROLE_ALUMNI.equals(normalizedRole)) {
            log.warn("Forbidden recruiter dashboard access requesterEmail={} requesterRole={} reason=insufficient_role",
                    requesterEmail, normalizedRole);
            throw new ForbiddenOperationException("Only recruiters can access dashboard");
        }
    }

    private void validateCanCloseJob(Job job, String requesterEmail, String requesterRole) {
        String normalizedRole = normalizeRole(requesterRole);

        if (ROLE_ADMIN.equals(normalizedRole)) {
            return;
        }

        if (!ROLE_RECRUITER.equals(normalizedRole) && !ROLE_ALUMNI.equals(normalizedRole)) {
            log.warn("Unauthorized close attempt jobId={} requesterEmail={} requesterRole={} reason=insufficient_role",
                    job.getId(), requesterEmail, normalizedRole);
            throw new ForbiddenOperationException("Only admins, alumni, or recruiters can close jobs");
        }

        if (requesterEmail == null || !requesterEmail.equalsIgnoreCase(job.getPostedByEmail())) {
            log.warn("Unauthorized close attempt jobId={} requesterEmail={} requesterRole={} postedByEmail={} reason=not_owner",
                    job.getId(), requesterEmail, normalizedRole, job.getPostedByEmail());
            throw new ForbiddenOperationException("Cannot close another user's job");
        }
    }

    private void validateCanUpdateJob(Job job, String requesterEmail, String requesterRole) {
        String normalizedRole = normalizeRole(requesterRole);

        if (job.getStatus() == JobStatus.CLOSED) {
            log.warn("Rejected closed job update jobId={} requesterEmail={} requesterRole={}",
                    job.getId(), requesterEmail, normalizedRole);
            throw new InvalidJobOperationException("Closed jobs cannot be edited");
        }

        if (ROLE_ADMIN.equals(normalizedRole)) {
            return;
        }

        if (!ROLE_RECRUITER.equals(normalizedRole) && !ROLE_ALUMNI.equals(normalizedRole)) {
            log.warn("Unauthorized job update attempt jobId={} requesterEmail={} requesterRole={} reason=insufficient_role",
                    job.getId(), requesterEmail, normalizedRole);
            throw new ForbiddenOperationException("Only admins, alumni, or recruiters can update jobs");
        }

        if (requesterEmail == null || !requesterEmail.equalsIgnoreCase(job.getPostedByEmail())) {
            log.warn("Unauthorized job update attempt jobId={} requesterEmail={} requesterRole={} postedByEmail={} reason=not_owner",
                    job.getId(), requesterEmail, normalizedRole, job.getPostedByEmail());
            throw new ForbiddenOperationException("Cannot update another user's job");
        }
    }

    private JobCreatedEvent toJobCreatedEvent(Job job) {
        return JobCreatedEvent.builder()
                .jobId(job.getId())
                .title(job.getTitle())
                .postedBy(job.getPostedByEmail())
                .description(job.getDescription())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .jobType(job.getJobType().name())
                .workMode(job.getWorkMode().name())
                .salaryRange(job.getSalaryRange())
                .applicationDeadline(job.getApplicationDeadline())
                .requirements(job.getRequirements())
                .responsibilities(job.getResponsibilities())
                .skillsRequired(new ArrayList<>(job.getSkillsRequired()))
                .experienceLevel(job.getExperienceLevel().name())
                .build();
    }

    private JobUpdatedEvent toJobUpdatedEvent(Job job) {
        return JobUpdatedEvent.builder()
                .jobId(job.getId())
                .title(job.getTitle())
                .postedBy(job.getPostedByEmail())
                .description(job.getDescription())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .jobType(job.getJobType().name())
                .workMode(job.getWorkMode().name())
                .salaryRange(job.getSalaryRange())
                .applicationDeadline(job.getApplicationDeadline())
                .requirements(job.getRequirements())
                .responsibilities(job.getResponsibilities())
                .skillsRequired(new ArrayList<>(job.getSkillsRequired()))
                .experienceLevel(job.getExperienceLevel().name())
                .status((job.getStatus() == null ? JobStatus.OPEN : job.getStatus()).name())
                .build();
    }

    private void validateJobOwnership(Job job, String recruiterEmail) {
        if (recruiterEmail == null || !recruiterEmail.equalsIgnoreCase(job.getPostedByEmail())) {
            throw new ForbiddenOperationException("Cannot manage applications for another recruiter's job");
        }
    }

    private void validateJobOpenForApplications(Job job, String studentEmail) {
        JobStatus status = job.getStatus() == null ? JobStatus.OPEN : job.getStatus();
        if (status == JobStatus.CLOSED) {
            log.info("Closed job application rejected jobId={} studentEmail={}", job.getId(), studentEmail);
            throw new InvalidJobOperationException("Applications are closed for this job");
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
