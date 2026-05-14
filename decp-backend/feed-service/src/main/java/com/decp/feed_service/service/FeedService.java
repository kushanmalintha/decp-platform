package com.decp.feed_service.service;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.entity.*;
import com.decp.feed_service.exception.EntityNotFoundException;
import com.decp.feed_service.exception.ForbiddenException;
import com.decp.feed_service.mapper.FeedMapper;
import com.decp.feed_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final FeedMapper feedMapper;

    public PostResponse createPost(String email, CreatePostRequest request) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(request.getContent())
                .likes(0)
                .createdAt(LocalDateTime.now())
                .build();

        Post savedPost = postRepository.save(post);
        return feedMapper.toPostResponse(savedPost);
    }

    public void createPost(String email, String content) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(content)
                .likes(0)
                .createdAt(LocalDateTime.now())
                .build();

        postRepository.save(post);
    }

    public Page<PostResponse> getAllPosts(Pageable pageable) {
        return postRepository.findAll(pageable)
                .map(feedMapper::toPostResponse);
    }

    public PostResponse updatePost(Long postId, UpdateFeedPostRequest request, String requesterEmail, String requesterRole) {
        log.info("Feed post update requested: postId={}, requesterEmail={}, requesterRole={}",
                postId, requesterEmail, requesterRole);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        if (isAdmin(requesterRole) || !isOwner(post, requesterEmail)) {
            log.warn("Forbidden feed modification attempt: action=update, postId={}, ownerEmail={}, requesterEmail={}, requesterRole={}",
                    postId, post.getAuthorEmail(), requesterEmail, requesterRole);
            throw new ForbiddenException("Only the post owner can edit this post");
        }

        post.setContent(request.getContent());
        Post savedPost = postRepository.save(post);

        log.info("Feed post updated successfully: postId={}, requesterEmail={}", postId, requesterEmail);
        return feedMapper.toPostResponse(savedPost);
    }

    @Transactional
    public void deletePost(Long postId, String requesterEmail, String requesterRole) {
        log.info("Feed post delete requested: postId={}, requesterEmail={}, requesterRole={}",
                postId, requesterEmail, requesterRole);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        if (!isOwner(post, requesterEmail) && !isAdmin(requesterRole)) {
            log.warn("Forbidden feed modification attempt: action=delete, postId={}, ownerEmail={}, requesterEmail={}, requesterRole={}",
                    postId, post.getAuthorEmail(), requesterEmail, requesterRole);
            throw new ForbiddenException("Only the post owner or an admin can delete this post");
        }

        commentRepository.deleteByPostId(postId);
        postRepository.delete(post);

        log.info("Feed post deleted successfully: postId={}, requesterEmail={}, requesterRole={}",
                postId, requesterEmail, requesterRole);
    }

    public PostResponse likePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        post.setLikes(post.getLikes() + 1);
        Post savedPost = postRepository.save(post);
        return feedMapper.toPostResponse(savedPost);
    }

    public CommentResponse addComment(Long postId, String email, CreateCommentRequest request) {
        // Verify post exists
        if (!postRepository.existsById(postId)) {
            throw new EntityNotFoundException("Post not found with id: " + postId);
        }

        Comment comment = Comment.builder()
                .postId(postId)
                .authorEmail(email)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        Comment savedComment = commentRepository.save(comment);
        return feedMapper.toCommentResponse(savedComment);
    }

    public List<CommentResponse> getComments(Long postId) {
        return commentRepository.findByPostId(postId)
                .stream()
                .map(feedMapper::toCommentResponse)
                .collect(Collectors.toList());
    }

    private boolean isOwner(Post post, String requesterEmail) {
        return post.getAuthorEmail() != null
                && requesterEmail != null
                && post.getAuthorEmail().equalsIgnoreCase(requesterEmail);
    }

    private boolean isAdmin(String requesterRole) {
        return "ADMIN".equalsIgnoreCase(requesterRole);
    }
}
