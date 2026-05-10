package com.decp.notification_service.kafka;

import com.decp.notification_service.event.JobAppliedEvent;
import com.decp.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobAppliedConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = "job.applied",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "jobAppliedKafkaListenerContainerFactory"
    )
    public void consume(JobAppliedEvent event) {
        try {
            notificationService.createJobAppliedNotification(event);
            log.info("Notification: New application received for {} from {}",
                    event.getJobTitle(),
                    event.getStudentEmail());
        } catch (Exception e) {
            log.error("Failed to process job.applied event", e);
        }
    }
}
