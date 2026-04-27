package com.decp.feed_service.service;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.entity.*;
import com.decp.feed_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public Post createPost(String email, CreatePostRequest request) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(request.getContent())
                .likes(0)
                .createdAt(LocalDateTime.now())
                .build();

        return postRepository.save(post);
    }

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Post likePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setLikes(post.getLikes() + 1);
        return postRepository.save(post);
    }

    public Comment addComment(Long postId, String email, CreateCommentRequest request) {
        Comment comment = Comment.builder()
                .postId(postId)
                .authorEmail(email)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        return commentRepository.save(comment);
    }

    public List<Comment> getComments(Long postId) {
        return commentRepository.findByPostId(postId);
    }
}
