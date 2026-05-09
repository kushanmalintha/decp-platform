package com.decp.notification_service.kafka;

import com.decp.notification_service.event.JobCreatedEvent;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "job.created", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(JobCreatedEvent event) {
        try {
            notificationService.createJobPostedNotification(event);

            String message = String.format("Notification: New job posted - %s by %s",
                    event.getTitle(),
                    event.getPostedBy());
            log.info("{}", message);
            System.out.println(message);
        } catch (Exception e) {
            log.error("Failed to process job.created event", e);
        }
    }
}
