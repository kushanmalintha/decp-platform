package com.decp.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RoleAssignmentResponse {
    private Long userId;
    private String email;
    private String role;
    private String message;
}
