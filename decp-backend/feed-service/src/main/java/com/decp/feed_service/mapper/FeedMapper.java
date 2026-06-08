package com.decp.feed_service.mapper;

import com.decp.feed_service.dto.CommentResponse;
import com.decp.feed_service.dto.PostResponse;
import com.decp.feed_service.entity.Comment;
import com.decp.feed_service.entity.Post;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Component
public class FeedMapper {

    public PostResponse toPostResponse(Post post) {
        return toPostResponse(post, false, 0);
    }

    public PostResponse toPostResponse(Post post, boolean likedByCurrentUser) {
        return toPostResponse(post, likedByCurrentUser, 0);
    }

    public PostResponse toPostResponse(Post post, boolean likedByCurrentUser, long commentCount) {
        if (post == null) {
            return null;
        }

        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .authorEmail(post.getAuthorEmail())
                .likes(post.getLikes())
                .commentCount(Math.toIntExact(commentCount))
                .likedByCurrentUser(likedByCurrentUser)
                .createdAt(toUtcOffsetDateTime(post.getCreatedAt()))
                .sourceType(post.getSourceType() == null
                        ? com.decp.feed_service.entity.FeedPostSourceType.MANUAL
                        : post.getSourceType())
                .sourceId(post.getSourceId())
                .build();
    }

    public CommentResponse toCommentResponse(Comment comment) {
        if (comment == null) {
            return null;
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorEmail(comment.getAuthorEmail())
                .content(comment.getContent())
                .createdAt(toUtcOffsetDateTime(comment.getCreatedAt()))
                .build();
    }

    private OffsetDateTime toUtcOffsetDateTime(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }
}
