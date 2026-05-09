package com.decp.api_gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${services.auth.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.user.url:http://localhost:8082}")
    private String userServiceUrl;

    @Value("${services.feed.url:http://localhost:8083}")
    private String feedServiceUrl;

    @Value("${services.job.url:http://localhost:8084}")
    private String jobServiceUrl;

    @Value("${services.notification.url:http://localhost:8085}")
    private String notificationServiceUrl;

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r
                        .path("/auth/**")
                        .uri(authServiceUrl))

                .route("user-service", r -> r
                        .path("/users/**")
                        .uri(userServiceUrl))

                .route("feed-service", r -> r
                        .path("/feed/**")
                        .uri(feedServiceUrl))

                .route("job-service", r -> r
                        .path("/jobs/**")
                        .uri(jobServiceUrl))

                .route("notification-service", r -> r
                        .path("/notifications/**")
                        .uri(notificationServiceUrl))

                .build();
    }
}
