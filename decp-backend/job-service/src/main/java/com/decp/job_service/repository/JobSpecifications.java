package com.decp.job_service.repository;

import com.decp.job_service.entity.ExperienceLevel;
import com.decp.job_service.entity.Job;
import com.decp.job_service.entity.JobStatus;
import com.decp.job_service.entity.JobType;
import com.decp.job_service.entity.WorkMode;
import org.springframework.data.jpa.domain.Specification;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> withFilters(
            String keyword,
            JobStatus status,
            String postedByEmail,
            JobType jobType,
            WorkMode workMode,
            String location,
            ExperienceLevel experienceLevel) {
        Specification<Job> specification = hasKeyword(keyword);
        specification = and(specification, hasStatus(status));
        specification = and(specification, hasPostedByEmail(postedByEmail));
        specification = and(specification, hasJobType(jobType));
        specification = and(specification, hasWorkMode(workMode));
        specification = and(specification, hasLocation(location));
        return and(specification, hasExperienceLevel(experienceLevel));
    }

    private static Specification<Job> and(Specification<Job> left, Specification<Job> right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.and(right);
    }

    private static Specification<Job> hasKeyword(String keyword) {
        if (isBlank(keyword)) {
            return null;
        }

        return (root, query, criteriaBuilder) -> {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("title")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("companyName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("location")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("requirements")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("responsibilities")), pattern)
            );
        };
    }

    private static Specification<Job> hasStatus(JobStatus status) {
        if (status == null) {
            return null;
        }

        return (root, query, criteriaBuilder) -> {
            if (status == JobStatus.OPEN) {
                return criteriaBuilder.or(
                        criteriaBuilder.equal(root.<JobStatus>get("status"), JobStatus.OPEN),
                        criteriaBuilder.isNull(root.<JobStatus>get("status"))
                );
            }

            return criteriaBuilder.equal(root.<JobStatus>get("status"), status);
        };
    }

    private static Specification<Job> hasPostedByEmail(String postedByEmail) {
        if (isBlank(postedByEmail)) {
            return null;
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(
                        criteriaBuilder.lower(root.<String>get("postedByEmail")),
                        postedByEmail.trim().toLowerCase()
                );
    }

    private static Specification<Job> hasJobType(JobType jobType) {
        if (jobType == null) {
            return null;
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.<JobType>get("jobType"), jobType);
    }

    private static Specification<Job> hasWorkMode(WorkMode workMode) {
        if (workMode == null) {
            return null;
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.<WorkMode>get("workMode"), workMode);
    }

    private static Specification<Job> hasLocation(String location) {
        if (isBlank(location)) {
            return null;
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(
                        criteriaBuilder.lower(root.<String>get("location")),
                        "%" + location.trim().toLowerCase() + "%"
                );
    }

    private static Specification<Job> hasExperienceLevel(ExperienceLevel experienceLevel) {
        if (experienceLevel == null) {
            return null;
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.<ExperienceLevel>get("experienceLevel"), experienceLevel);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
