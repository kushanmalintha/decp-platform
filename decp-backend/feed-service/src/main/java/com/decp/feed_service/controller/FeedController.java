package com.decp.feed_service.controller;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.security.JwtUtil;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;
    private final JwtUtil jwtUtil;

    @PostMapping("/posts")
    public PostResponse createPost(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreatePostRequest request) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return feedService.createPost(user.email(), request);
    }

    @GetMapping("/posts")
    public Page<PostResponse> getAllPosts(Pageable pageable) {
        return feedService.getAllPosts(pageable);
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(feedService.getPostById(id));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateFeedPostRequest request) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return ResponseEntity.ok(feedService.updatePost(id, request, user.email(), user.role()));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        feedService.deletePost(id, user.email(), user.role());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{id}/like")
    public PostResponse likePost(@PathVariable Long id) {
        return feedService.likePost(id);
    }

    @PostMapping("/posts/{id}/comments")
    public CommentResponse addComment(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateCommentRequest request) {

        JwtUtil.UserContext user = jwtUtil.extractUser(authHeader);
        return feedService.addComment(id, user.email(), request);
    }

    @GetMapping("/posts/{id}/comments")
    public List<CommentResponse> getComments(@PathVariable Long id) {
        return feedService.getComments(id);
    }
}
