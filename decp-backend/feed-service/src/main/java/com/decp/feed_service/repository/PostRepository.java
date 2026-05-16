package com.decp.feed_service.repository;

import com.decp.feed_service.entity.FeedPostSourceType;
import com.decp.feed_service.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    Optional<Post> findBySourceTypeAndSourceId(FeedPostSourceType sourceType, Long sourceId);
}
