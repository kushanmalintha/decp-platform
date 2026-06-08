package com.decp.feed_service.service;

import com.decp.feed_service.dto.*;
import com.decp.feed_service.entity.*;
import com.decp.feed_service.event.JobClosedEvent;
import com.decp.feed_service.event.JobUpdatedEvent;
import com.decp.feed_service.exception.EntityNotFoundException;
import com.decp.feed_service.exception.ForbiddenException;
import com.decp.feed_service.mapper.FeedMapper;
import com.decp.feed_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final FeedMapper feedMapper;

    public PostResponse createPost(String email, CreatePostRequest request) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(request.getContent())
                .likes(0)
                .createdAt(currentUtcTime())
                .sourceType(FeedPostSourceType.MANUAL)
                .build();

        Post savedPost = postRepository.save(post);
        return feedMapper.toPostResponse(savedPost);
    }

    public void createPost(String email, String content) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(content)
                .likes(0)
                .createdAt(currentUtcTime())
                .sourceType(FeedPostSourceType.MANUAL)
                .build();

        postRepository.save(post);
    }

    public void createJobPost(String email, Long jobId, String content) {
        Post post = Post.builder()
                .authorEmail(email)
                .content(content)
                .likes(0)
                .createdAt(currentUtcTime())
                .sourceType(FeedPostSourceType.JOB)
                .sourceId(jobId)
                .build();

        Post savedPost = postRepository.save(post);
        log.info("Created job-generated feed post postId={} jobId={} authorEmail={}",
                savedPost.getId(),
                jobId,
                email);
    }

    public Page<PostResponse> getAllPosts(Pageable pageable, String requesterEmail) {
        return postRepository.findAll(pageable)
                .map(post -> feedMapper.toPostResponse(
                        post,
                        hasLiked(post.getId(), requesterEmail),
                        commentRepository.countByPostId(post.getId())));
    }

    public PostResponse getPostById(Long postId, String requesterEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        return feedMapper.toPostResponse(post, hasLiked(postId, requesterEmail), commentRepository.countByPostId(postId));
    }

    public PostResponse updatePost(Long postId, UpdateFeedPostRequest request, String requesterEmail, String requesterRole) {
        log.info("Feed post update requested: postId={}, requesterEmail={}, requesterRole={}",
                postId, requesterEmail, requesterRole);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        if (isJobGenerated(post)) {
            log.warn("Blocked manual edit of job-generated feed post postId={} sourceId={} requesterEmail={}",
                    postId,
                    post.getSourceId(),
                    requesterEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job-generated feed posts cannot be edited manually");
        }

        if (isAdmin(requesterRole) || !isOwner(post, requesterEmail)) {
            log.warn("Forbidden feed modification attempt: action=update, postId={}, ownerEmail={}, requesterEmail={}, requesterRole={}",
                    postId, post.getAuthorEmail(), requesterEmail, requesterRole);
            throw new ForbiddenException("Only the post owner can edit this post");
        }

        post.setContent(request.getContent());
        Post savedPost = postRepository.save(post);

        log.info("Feed post updated successfully: postId={}, requesterEmail={}", postId, requesterEmail);
        return feedMapper.toPostResponse(savedPost, hasLiked(postId, requesterEmail), commentRepository.countByPostId(postId));
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
        postLikeRepository.deleteByPostId(postId);
        postRepository.delete(post);

        log.info("Feed post deleted successfully: postId={}, requesterEmail={}, requesterRole={}",
                postId, requesterEmail, requesterRole);
    }

    @Transactional
    public PostResponse likePost(Long postId, String requesterEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));

        String normalizedEmail = normalizeEmail(requesterEmail);
        boolean likedByCurrentUser;
        var existingLike = postLikeRepository.findByPostIdAndUserEmailIgnoreCase(postId, normalizedEmail);

        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            post.setLikes(Math.max(0, post.getLikes() - 1));
            likedByCurrentUser = false;
        } else {
            PostLike postLike = PostLike.builder()
                    .postId(postId)
                    .userEmail(normalizedEmail)
                    .createdAt(currentUtcTime())
                    .build();
            postLikeRepository.save(postLike);
            post.setLikes(post.getLikes() + 1);
            likedByCurrentUser = true;
        }

        Post savedPost = postRepository.save(post);
        return feedMapper.toPostResponse(savedPost, likedByCurrentUser, commentRepository.countByPostId(postId));
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
                .createdAt(currentUtcTime())
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

    @Transactional
    public void updateJobPostClosed(JobClosedEvent event) {
        if (event == null || event.getJobId() == null) {
            log.warn("Received invalid job.closed event with missing jobId");
            return;
        }

        postRepository.findBySourceTypeAndSourceId(FeedPostSourceType.JOB, event.getJobId())
                .ifPresentOrElse(post -> {
                    post.setContent(buildClosedJobContent(event));
                    postRepository.save(post);
                    log.info("Updated job-generated feed post as closed postId={} jobId={}",
                            post.getId(),
                            event.getJobId());
                }, () -> log.warn("No job-generated feed post found for closed job jobId={}", event.getJobId()));
    }

    @Transactional
    public void updateJobPostUpdated(JobUpdatedEvent event) {
        if (event == null || event.getJobId() == null) {
            log.warn("Received invalid job.updated event with missing jobId");
            return;
        }

        postRepository.findBySourceTypeAndSourceId(FeedPostSourceType.JOB, event.getJobId())
                .ifPresentOrElse(post -> {
                    post.setContent(buildUpdatedJobContent(event));
                    postRepository.save(post);
                    log.info("Updated existing job-generated feed post from job.updated postId={} jobId={}",
                            post.getId(),
                            event.getJobId());
                }, () -> log.warn("No job-generated feed post found for updated job jobId={}", event.getJobId()));
    }

    private String buildUpdatedJobContent(JobUpdatedEvent event) {
        return String.join("\n",
                "Job updated: " + valueOrDefault(event.getTitle()),
                "Company: " + valueOrDefault(event.getCompanyName()),
                "Location: " + valueOrDefault(event.getLocation()),
                "Type: " + valueOrDefault(event.getJobType()),
                "Work mode: " + valueOrDefault(event.getWorkMode()),
                "Experience: " + valueOrDefault(event.getExperienceLevel()),
                "Salary: " + valueOrDefault(event.getSalaryRange()),
                "Application deadline: " + valueOrDefault(event.getApplicationDeadline()),
                "Description: " + valueOrDefault(event.getDescription()),
                "Requirements: " + valueOrDefault(event.getRequirements()),
                "Responsibilities: " + valueOrDefault(event.getResponsibilities()),
                "Skills required: " + joinSkills(event.getSkillsRequired()));
    }

    private String buildClosedJobContent(JobClosedEvent event) {
        return String.join("\n",
                "[Closed] Job closed: " + valueOrDefault(event.getTitle()),
                "",
                "This job posting is now closed.",
                "",
                "Posted by: " + valueOrDefault(event.getPostedByEmail()),
                "Company: " + valueOrDefault(event.getCompanyName()),
                "Location: " + valueOrDefault(event.getLocation()),
                "Type: " + valueOrDefault(event.getJobType()),
                "Work mode: " + valueOrDefault(event.getWorkMode()));
    }

    private String joinSkills(List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return "N/A";
        }
        return String.join(", ", skills);
    }

    private String valueOrDefault(Object value) {
        if (value == null) {
            return "N/A";
        }
        String text = value.toString();
        return text.isBlank() ? "N/A" : text;
    }

    private boolean isOwner(Post post, String requesterEmail) {
        return post.getAuthorEmail() != null
                && requesterEmail != null
                && post.getAuthorEmail().equalsIgnoreCase(requesterEmail);
    }

    private boolean isAdmin(String requesterRole) {
        return "ADMIN".equalsIgnoreCase(requesterRole);
    }

    private boolean isJobGenerated(Post post) {
        return FeedPostSourceType.JOB.equals(post.getSourceType());
    }

    private boolean hasLiked(Long postId, String requesterEmail) {
        return postId != null
                && requesterEmail != null
                && !requesterEmail.isBlank()
                && postLikeRepository.existsByPostIdAndUserEmailIgnoreCase(postId, normalizeEmail(requesterEmail));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private LocalDateTime currentUtcTime() {
        return LocalDateTime.now(Clock.systemUTC());
    }
}
