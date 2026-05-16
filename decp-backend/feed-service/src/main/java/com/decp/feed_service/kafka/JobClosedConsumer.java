package com.decp.feed_service.kafka;

import com.decp.feed_service.event.JobClosedEvent;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobClosedConsumer {

    private final FeedService feedService;

    @KafkaListener(
            topics = "job.closed",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "jobClosedKafkaListenerContainerFactory"
    )
    public void consume(JobClosedEvent event) {
        try {
            log.info("Consumed Kafka event topic=job.closed jobId={} status={}", event.getJobId(), event.getStatus());
            feedService.updateJobPostClosed(event);
        } catch (Exception e) {
            log.error("Failed to process job.closed event jobId={}", event == null ? null : event.getJobId(), e);
        }
    }
}
