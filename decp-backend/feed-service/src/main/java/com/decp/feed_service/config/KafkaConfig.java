package com.decp.feed_service.config;

import com.decp.feed_service.event.JobCreatedEvent;
import com.decp.feed_service.event.JobClosedEvent;
import com.decp.feed_service.event.JobUpdatedEvent;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @Bean
    public ConsumerFactory<String, JobCreatedEvent> consumerFactory() {
        Map<String, Object> configs = new HashMap<>();
        configs.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configs.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        configs.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configs.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configs.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        configs.put("spring.json.trusted.packages", "*");
        configs.put("spring.json.value.default.type", JobCreatedEvent.class.getName());
        configs.put("spring.json.use.type.headers", false);
        return new DefaultKafkaConsumerFactory<>(configs);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, JobCreatedEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, JobCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, JobUpdatedEvent> jobUpdatedConsumerFactory() {
        Map<String, Object> configs = new HashMap<>();
        configs.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configs.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        configs.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configs.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configs.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        configs.put("spring.json.trusted.packages", "*");
        configs.put("spring.json.value.default.type", JobUpdatedEvent.class.getName());
        configs.put("spring.json.use.type.headers", false);
        return new DefaultKafkaConsumerFactory<>(configs);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, JobUpdatedEvent> jobUpdatedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, JobUpdatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(jobUpdatedConsumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, JobClosedEvent> jobClosedConsumerFactory() {
        Map<String, Object> configs = new HashMap<>();
        configs.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configs.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        configs.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configs.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configs.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        configs.put("spring.json.trusted.packages", "*");
        configs.put("spring.json.value.default.type", JobClosedEvent.class.getName());
        configs.put("spring.json.use.type.headers", false);
        return new DefaultKafkaConsumerFactory<>(configs);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, JobClosedEvent> jobClosedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, JobClosedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(jobClosedConsumerFactory());
        return factory;
    }
}
