package com.decp.feed_service.controller;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.security.JwtUtil;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
