package com.decp.feed_service.mapper;

import com.decp.feed_service.dto.CommentResponse;
import com.decp.feed_service.dto.PostResponse;
import com.decp.feed_service.entity.Comment;
import com.decp.feed_service.entity.Post;
import org.springframework.stereotype.Component;

@Component
public class FeedMapper {

    public PostResponse toPostResponse(Post post) {
        if (post == null) {
            return null;
        }

        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .authorEmail(post.getAuthorEmail())
                .likes(post.getLikes())
                .createdAt(post.getCreatedAt())
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
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
