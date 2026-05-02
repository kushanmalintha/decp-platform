package com.decp.auth_service.dto;

import lombok.Data;

@Data
public class RoleAssignmentRequest {
    private String email;
    private String role;
}
