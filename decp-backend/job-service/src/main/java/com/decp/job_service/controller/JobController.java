package com.decp.job_service.controller;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.dto.UpdateApplicationStatusRequest;
import com.decp.job_service.entity.JobStatus;
import com.decp.job_service.security.JwtUtil;
import com.decp.job_service.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
        return jobService.createJob(user.email(), request);
    }

    @GetMapping("/jobs")
    public Page<JobResponse> getAllJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String postedByEmail,
            Pageable pageable) {
        return jobService.getAllJobs(keyword, status, postedByEmail, pageable);
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
