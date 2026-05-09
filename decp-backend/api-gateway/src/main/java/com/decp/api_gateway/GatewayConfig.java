package com.decp.api_gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r
                        .path("/auth/**")
                        .uri("http://localhost:8081"))

                .route("user-service", r -> r
                        .path("/users/**")
                        .uri("http://localhost:8082"))

                .route("feed-service", r -> r
                        .path("/feed/**")
                        .uri("http://localhost:8083"))

                .route("job-service", r -> r
                        .path("/jobs/**")
                        .uri("http://localhost:8084"))

                .route("notification-service", r -> r
                        .path("/notifications/**")
                        .uri("http://localhost:8085"))

                .build();
    }
}
