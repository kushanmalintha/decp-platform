package com.decp.feed_service.service;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.entity.*;
import com.decp.feed_service.exception.EntityNotFoundException;
import com.decp.feed_service.mapper.FeedMapper;
import com.decp.feed_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
}
