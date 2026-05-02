package com.decp.job_service.controller;

import com.decp.job_service.dto.CreateJobRequest;
import com.decp.job_service.entity.*;
import com.decp.job_service.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public Job createJob(
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreateJobRequest request) {

        return jobService.createJob(email, request);
    }

    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    @PostMapping("/{id}/apply")
    public JobApplication apply(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String email) {

        return jobService.apply(id, email);
    }

    @GetMapping("/{id}/applications")
    public List<JobApplication> getApplications(@PathVariable Long id) {
        return jobService.getApplications(id);
    }
}
