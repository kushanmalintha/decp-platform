package com.decp.job_service.kafka;

import com.decp.job_service.event.JobCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobEventProducer {

    private final KafkaTemplate<String, JobCreatedEvent> kafkaTemplate;

    public void sendJobCreatedEvent(JobCreatedEvent event) {
        log.info("Sending job.created event: {}", event);
        kafkaTemplate.send("job.created", event);
    }
}
