package com.decp.job_service.repository;

import com.decp.job_service.entity.Job;
import com.decp.job_service.entity.JobStatus;
import org.springframework.data.jpa.domain.Specification;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> withFilters(String keyword, JobStatus status, String postedByEmail) {
        Specification<Job> specification = hasKeyword(keyword);
        specification = and(specification, hasStatus(status));
        return and(specification, hasPostedByEmail(postedByEmail));
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
                    criteriaBuilder.like(criteriaBuilder.lower(root.<String>get("description")), pattern)
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

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
