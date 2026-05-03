package com.decp.feed_service.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {

    private Long id;
    private String content;
    private String authorEmail;
    private int likes;
    private LocalDateTime createdAt;
}
