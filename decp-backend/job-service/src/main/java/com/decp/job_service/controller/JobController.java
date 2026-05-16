package com.decp.job_service.controller;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.dto.RecruiterDashboardResponse;
import com.decp.job_service.dto.UpdateApplicationStatusRequest;
import com.decp.job_service.dto.UpdateJobRequest;
import com.decp.job_service.entity.ExperienceLevel;
import com.decp.job_service.entity.JobStatus;
import com.decp.job_service.entity.JobType;
import com.decp.job_service.entity.WorkMode;
import com.decp.job_service.security.JwtUtil;
import com.decp.job_service.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final JwtUtil jwtUtil;

    @PostMapping("/jobs")
    public JobResponse createJob(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateJobRequest request) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.createJob(user.email(), user.role(), request);
    }

    @GetMapping("/jobs")
    public Page<JobResponse> getAllJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String postedByEmail,
            @RequestParam(required = false) JobType jobType,
            @RequestParam(required = false) WorkMode workMode,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ExperienceLevel experienceLevel,
            Pageable pageable) {
        return jobService.getAllJobs(keyword, status, postedByEmail, jobType, workMode, location, experienceLevel, pageable);
    }

    @PutMapping("/jobs/{id}")
    public ResponseEntity<JobResponse> updateJob(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateJobRequest request) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return ResponseEntity.ok(jobService.updateJob(id, user.email(), user.role(), request));
    }

    @PostMapping("/jobs/{id}/save")
    public ResponseEntity<JobResponse> saveJob(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return ResponseEntity.ok(jobService.saveJob(id, user.email(), user.role()));
    }

    @DeleteMapping("/jobs/{id}/save")
    public ResponseEntity<Void> unsaveJob(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        jobService.unsaveJob(id, user.email(), user.role());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/jobs/saved")
    public Page<JobResponse> getSavedJobs(
            @RequestHeader("Authorization") String authHeader,
            Pageable pageable) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.getSavedJobs(user.email(), user.role(), pageable);
    }

    @GetMapping("/jobs/recruiter/dashboard")
    public ResponseEntity<RecruiterDashboardResponse> getRecruiterDashboard(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return ResponseEntity.ok(jobService.getRecruiterDashboard(user.email(), user.role()));
    }

    @PatchMapping("/jobs/{id}/close")
    public ResponseEntity<JobResponse> closeJob(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return ResponseEntity.ok(jobService.closeJob(id, user.email(), user.role()));
    }

    @PostMapping("/jobs/{id}/apply")
    public JobApplicationResponse apply(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.applyForJob(id, user.email(), user.role());
    }

    @GetMapping("/jobs/{id}/applications")
    public List<JobApplicationResponse> getApplications(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.getApplicationsForJob(id, user.email(), user.role());
    }

    @GetMapping("/jobs/applications/me")
    public List<JobApplicationResponse> getMyApplications(
            @RequestHeader("Authorization") String authHeader) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.getMyApplications(user.email(), user.role());
    }

    @PatchMapping("/jobs/applications/{id}/status")
    public JobApplicationResponse updateApplicationStatus(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateApplicationStatusRequest request) {
        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return jobService.updateApplicationStatus(id, user.email(), user.role(), request);
    }
}
