package com.decp.job_service.controller;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.dto.JobApplicationResponse;
import com.decp.job_service.dto.JobResponse;
import com.decp.job_service.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public JobResponse createJob(
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreateJobRequest request) {

        return jobService.createJob(email, request);
    }

    @GetMapping
    public Page<JobResponse> getAllJobs(Pageable pageable) {
        return jobService.getAllJobs(pageable);
    }

    @PostMapping("/{id}/apply")
    public JobApplicationResponse apply(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String email) {

        return jobService.apply(id, email);
    }

    @GetMapping("/{id}/applications")
    public List<JobApplicationResponse> getApplications(@PathVariable Long id) {
        return jobService.getApplications(id);
    }
}
