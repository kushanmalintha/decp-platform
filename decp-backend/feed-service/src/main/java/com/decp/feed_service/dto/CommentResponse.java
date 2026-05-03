package com.decp.feed_service.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private Long id;
    private Long postId;
    private String authorEmail;
    private String content;
    private LocalDateTime createdAt;
}
