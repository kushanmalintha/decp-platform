package com.decp.auth_service.client;

import com.decp.auth_service.dto.CreateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user-service.url:http://localhost:8082}")
    private String userServiceUrl;

    public void createUser(CreateUserRequest request) {
        try {
            String url = userServiceUrl + "/users/register";
            restTemplate.postForObject(url, request, Void.class);
        } catch (Exception e) {
            // Log error but don't fail registration if user service is unavailable
            System.err.println("Failed to create user in user-service: " + e.getMessage());
        }
    }
}
