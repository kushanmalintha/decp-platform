package com.decp.feed_service.kafka;

import com.decp.feed_service.event.JobCreatedEvent;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.StringJoiner;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobEventConsumer {

    private final FeedService feedService;

    @KafkaListener(topics = "job.created", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(JobCreatedEvent event) {
        log.info("Received job.created event: {}", event);

        try {
            String content = buildJobPostContent(event);
            feedService.createJobPost(event.getPostedBy(), event.getJobId(), content);
        } catch (Exception e) {
            log.error("Failed to process job.created event", e);
        }
    }

    private String buildJobPostContent(JobCreatedEvent event) {
        StringJoiner content = new StringJoiner("\n");
        content.add("New job posted: " + valueOrDefault(event.getTitle()));
        content.add("Company: " + valueOrDefault(event.getCompanyName()));
        content.add("Location: " + valueOrDefault(event.getLocation()));
        content.add("Type: " + valueOrDefault(event.getJobType()));
        content.add("Work mode: " + valueOrDefault(event.getWorkMode()));
        content.add("Experience: " + valueOrDefault(event.getExperienceLevel()));
        content.add("Salary: " + valueOrDefault(event.getSalaryRange()));
        content.add("Application deadline: " + valueOrDefault(event.getApplicationDeadline()));
        content.add("Description: " + valueOrDefault(event.getDescription()));
        content.add("Requirements: " + valueOrDefault(event.getRequirements()));
        content.add("Responsibilities: " + valueOrDefault(event.getResponsibilities()));
        content.add("Skills required: " + joinSkills(event.getSkillsRequired()));
        return content.toString();
    }

    private String joinSkills(List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return "N/A";
        }
        return String.join(", ", skills);
    }

    private String valueOrDefault(Object value) {
        if (value == null) {
            return "N/A";
        }
        String text = value.toString();
        return text.isBlank() ? "N/A" : text;
    }
}
