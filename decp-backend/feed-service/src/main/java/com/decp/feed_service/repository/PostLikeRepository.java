package com.decp.feed_service.repository;

import com.decp.feed_service.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostIdAndUserEmailIgnoreCase(Long postId, String userEmail);
    boolean existsByPostIdAndUserEmailIgnoreCase(Long postId, String userEmail);
    void deleteByPostId(Long postId);
}
