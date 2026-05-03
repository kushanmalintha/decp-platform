package com.decp.feed_service.controller;

import com.decp.feed_service.dto.*;
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

    @PostMapping("/posts")
    public PostResponse createPost(
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreatePostRequest request) {

        return feedService.createPost(email, request);
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
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreateCommentRequest request) {

        return feedService.addComment(id, email, request);
    }

    @GetMapping("/posts/{id}/comments")
    public List<CommentResponse> getComments(@PathVariable Long id) {
        return feedService.getComments(id);
    }
}
