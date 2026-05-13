package com.decp.notification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UnreadNotificationCountResponse {

    private long count;
}
