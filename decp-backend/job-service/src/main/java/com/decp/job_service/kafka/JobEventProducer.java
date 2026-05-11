package com.decp.job_service.kafka;

import com.decp.job_service.event.ApplicationStatusUpdatedEvent;
import com.decp.job_service.event.JobAppliedEvent;
import com.decp.job_service.event.JobCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobEventProducer {

    private static final String TOPIC_JOB_CREATED = "job.created";
    private static final String TOPIC_JOB_APPLIED = "job.applied";
    private static final String TOPIC_APPLICATION_STATUS_UPDATED = "application.status.updated";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendJobCreatedEvent(JobCreatedEvent event) {
        log.info("Publishing Kafka event topic={} jobId={}", TOPIC_JOB_CREATED, event.getJobId());
        kafkaTemplate.send(TOPIC_JOB_CREATED, event);
    }

    public void sendJobAppliedEvent(JobAppliedEvent event) {
        log.info("Publishing Kafka event topic={} jobId={} studentEmail={}",
                TOPIC_JOB_APPLIED,
                event.getJobId(),
                event.getStudentEmail());
        kafkaTemplate.send(TOPIC_JOB_APPLIED, event);
    }

    public void sendApplicationStatusUpdatedEvent(ApplicationStatusUpdatedEvent event) {
        log.info("Publishing Kafka event topic={} applicationId={} jobId={} status={}",
                TOPIC_APPLICATION_STATUS_UPDATED,
                event.getApplicationId(),
                event.getJobId(),
                event.getStatus());
        kafkaTemplate.send(TOPIC_APPLICATION_STATUS_UPDATED, event);
    }
}
