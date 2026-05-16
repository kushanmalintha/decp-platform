package com.decp.feed_service.kafka;

import com.decp.feed_service.event.JobUpdatedEvent;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobUpdatedConsumer {

    private final FeedService feedService;

    @KafkaListener(
            topics = "job.updated",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "jobUpdatedKafkaListenerContainerFactory"
    )
    public void consume(JobUpdatedEvent event) {
        try {
            log.info("Consumed Kafka event topic=job.updated jobId={} status={}", event.getJobId(), event.getStatus());
            feedService.updateJobPostUpdated(event);
        } catch (Exception e) {
            log.error("Failed to process job.updated event jobId={}", event == null ? null : event.getJobId(), e);
        }
    }
}
