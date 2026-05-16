package com.decp.notification_service.kafka;

import com.decp.notification_service.event.JobClosedEvent;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobClosedConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = "job.closed",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "jobClosedKafkaListenerContainerFactory"
    )
    public void consume(JobClosedEvent event) {
        try {
            log.info("Consumed Kafka event topic=job.closed jobId={} status={}", event.getJobId(), event.getStatus());
            notificationService.createJobClosedNotification(event);
        } catch (Exception e) {
            log.error("Failed to process job.closed event", e);
        }
    }
}
