package com.decp.notification_service.kafka;

import com.decp.notification_service.event.ApplicationStatusUpdatedEvent;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationStatusUpdatedConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = "application.status.updated",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "applicationStatusUpdatedKafkaListenerContainerFactory"
    )
    public void consume(ApplicationStatusUpdatedEvent event) {
        try {
            log.info("Consumed Kafka event topic=application.status.updated applicationId={} jobId={} status={}",
                    event.getApplicationId(),
                    event.getJobId(),
                    event.getStatus());
            notificationService.createApplicationStatusUpdatedNotification(event);
        } catch (Exception e) {
            log.error("Failed to process application.status.updated event", e);
        }
    }
}
