package com.decp.feed_service.dto;

import com.decp.feed_service.entity.FeedPostSourceType;
import lombok.*;

import java.time.OffsetDateTime;

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
    private int commentCount;
    private boolean likedByCurrentUser;
    private OffsetDateTime createdAt;
    private FeedPostSourceType sourceType;
    private Long sourceId;
}
