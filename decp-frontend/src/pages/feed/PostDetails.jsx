import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createComment,
  deletePost,
  getComments,
  getPostById,
  likePost,
  updatePost,
} from "../../api/feedApi";
import { useAuth } from "../../auth/useAuth";
import CommentForm from "../../components/feed/CommentForm";
import CommentList from "../../components/feed/CommentList";
import PostCard from "../../components/feed/PostCard";
import PostForm from "../../components/feed/PostForm";
import "./Feed.css";

const normalizeRole = (role) => role?.toUpperCase?.() ?? "";

const isManualPost = (post) => (post?.sourceType?.toUpperCase?.() ?? "MANUAL") === "MANUAL";

const isOwner = (post, user) =>
  Boolean(post?.authorEmail && user?.email && post.authorEmail.toLowerCase() === user.email.toLowerCase());

const canEditPost = (post, user) => isManualPost(post) && isOwner(post, user) && normalizeRole(user?.role) !== "ADMIN";

const canDeletePost = (post, user) => normalizeRole(user?.role) === "ADMIN" || (isManualPost(post) && isOwner(post, user));

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

const getMutationErrorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "You do not have permission to complete this action.";
  }

  if (error.response?.status === 404) {
    return "This post could not be found.";
  }

  if (error.response?.status === 400) {
    return error.response?.data?.message ?? "Please check the content and try again.";
  }

  return getErrorMessage(error, fallback);
};

const normalizeComments = (commentsData) => {
  if (Array.isArray(commentsData)) {
    return commentsData;
  }

  if (Array.isArray(commentsData?.content)) {
    return commentsData.content;
  }

  return [];
};

const mergePostResponse = (currentPost, responseData, fallbackLikesDelta = 0) => {
  if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
    const responseLooksLikePost = responseData.id || responseData.content || responseData.sourceType;

    if (responseLooksLikePost) {
      return { ...currentPost, ...responseData };
    }

    if (Object.prototype.hasOwnProperty.call(responseData, "likes")) {
      return { ...currentPost, likes: responseData.likes };
    }

    if (Object.prototype.hasOwnProperty.call(responseData, "likeCount")) {
      return { ...currentPost, likeCount: responseData.likeCount };
    }
  }

  return {
    ...currentPost,
    likes: Number(currentPost.likes ?? currentPost.likeCount ?? 0) + fallbackLikesDelta,
    likedByCurrentUser: !currentPost?.likedByCurrentUser,
  };
};

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [error, setError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const postData = await getPostById(id);

        if (isMounted) {
          setPost(postData);
          setNotFound(!postData);
        }
      } catch (loadError) {
        if (isMounted) {
          setPost(null);

          if (loadError.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(getErrorMessage(loadError, "Unable to load post details."));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError("");

      try {
        const commentsData = await getComments(id);

        if (isMounted) {
          setComments(normalizeComments(commentsData));
        }
      } catch (loadError) {
        if (isMounted) {
          setComments([]);
          setCommentsError(getErrorMessage(loadError, "Unable to load comments."));
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleLikePost = async () => {
    setLiking(true);
    setActionError("");

    try {
      const likedPost = await likePost(post.id);
      setPost((currentPost) =>
        mergePostResponse(currentPost, likedPost, currentPost?.likedByCurrentUser ? -1 : 1),
      );
    } catch (likeError) {
      setActionError(getMutationErrorMessage(likeError, "Unable to like this post."));
    } finally {
      setLiking(false);
    }
  };

  const handleUpdatePost = async (data) => {
    if (!isManualPost(post)) {
      setActionError("Job-generated posts are updated through the job workflow.");
      return false;
    }

    setEditing(true);
    setSuccess("");
    setActionError("");

    try {
      const updatedPost = await updatePost(post.id, data);
      setPost((currentPost) => ({ ...currentPost, ...updatedPost, ...data }));
      setEditMode(false);
      setSuccess("Post updated successfully.");
      return true;
    } catch (updateError) {
      setActionError(getMutationErrorMessage(updateError, "Unable to update this post."));
      return false;
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    setDeleting(true);
    setSuccess("");
    setActionError("");

    try {
      await deletePost(post.id);
      navigate("/feed", { replace: true });
    } catch (deleteError) {
      setActionError(getMutationErrorMessage(deleteError, "Unable to delete this post."));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateComment = async (data) => {
    setCommenting(true);
    setActionError("");

    try {
      const createdComment = await createComment(post.id, data);

      if (createdComment && typeof createdComment === "object" && !Array.isArray(createdComment)) {
        setComments((currentComments) => [...currentComments, createdComment]);
      } else {
        const commentsData = await getComments(post.id);
        setComments(normalizeComments(commentsData));
      }

      return true;
    } catch (commentError) {
      setActionError(getMutationErrorMessage(commentError, "Unable to add this comment."));
      return false;
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <section className="feed-page">
        <div className="feed-state">Loading post details...</div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="feed-page">
        <div className="feed-page__header">
          <div>
            <h1>Post Not Found</h1>
            <p>This post may have been removed.</p>
          </div>
          <Link className="feed-button feed-button--secondary" to="/feed">
            Back to Feed
          </Link>
        </div>
      </section>
    );
  }

  if (error && !post) {
    return (
      <section className="feed-page">
        <div className="feed-page__header">
          <div>
            <h1>Post Details</h1>
          </div>
          <Link className="feed-button feed-button--secondary" to="/feed">
            Back to Feed
          </Link>
        </div>
        <div className="form-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="feed-page">
      <div className="feed-page__header">
        <div>
          <h1>Post Details</h1>
          <p>View the full post and discussion.</p>
        </div>
        <Link className="feed-button feed-button--secondary" to="/feed">
          Back to Feed
        </Link>
      </div>

      {success && <div className="form-success">{success}</div>}
      {actionError && <div className="form-error">{actionError}</div>}

      <PostCard
        post={post}
        canEdit={canEditPost(post, user)}
        canDelete={canDeletePost(post, user)}
        liking={liking}
        deleting={deleting}
        onLike={handleLikePost}
        onEdit={() => setEditMode(true)}
        onDelete={handleDeletePost}
      >
        {editMode && (
          <PostForm
            initialContent={post.content}
            submitLabel="Save Changes"
            submitting={editing}
            onSubmit={handleUpdatePost}
            onCancel={() => setEditMode(false)}
          />
        )}
      </PostCard>

      <section className="feed-comments" aria-labelledby="comments-heading">
        <div className="feed-comments__header">
          <h2 id="comments-heading">Comments</h2>
          <span>{comments.length}</span>
        </div>
        <CommentForm submitting={commenting} onSubmit={handleCreateComment} />
        <CommentList comments={comments} loading={commentsLoading} error={commentsError} />
      </section>
    </section>
  );
};

export default PostDetails;
