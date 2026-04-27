package com.decp.feed_service.controller;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.entity.*;
import com.decp.feed_service.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @PostMapping("/posts")
    public Post createPost(
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreatePostRequest request) {

        return feedService.createPost(email, request);
    }

    @GetMapping("/posts")
    public List<Post> getAllPosts() {
        return feedService.getAllPosts();
    }

    @PostMapping("/posts/{id}/like")
    public Post likePost(@PathVariable Long id) {
        return feedService.likePost(id);
    }

    @PostMapping("/posts/{id}/comments")
    public Comment addComment(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String email,
            @RequestBody CreateCommentRequest request) {

        return feedService.addComment(id, email, request);
    }

    @GetMapping("/posts/{id}/comments")
    public List<Comment> getComments(@PathVariable Long id) {
        return feedService.getComments(id);
    }
}
