package com.decp.feed_service.kafka;

import com.decp.feed_service.event.JobCreatedEvent;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobEventConsumer {

    private final FeedService feedService;

    @KafkaListener(topics = "job.created", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(JobCreatedEvent event) {
        log.info("Received job.created event: {}", event);

        try {
            String content = "New job posted: " + event.getTitle();
            feedService.createPost(event.getPostedBy(), content);
        } catch (Exception e) {
            log.error("Failed to process job.created event", e);
        }
    }
}
