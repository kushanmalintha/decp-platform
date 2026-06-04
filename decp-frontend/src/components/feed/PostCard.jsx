import { Link } from "react-router-dom";
import { Edit3, Heart, MessageCircle, Trash2 } from "lucide-react";

import SourceBadge from "./SourceBadge";

const formatDateTime = (value) => {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getLikes = (post) => Number(post?.likes ?? post?.likeCount ?? 0);
const isLikedByCurrentUser = (post) => Boolean(post?.likedByCurrentUser);

const PostCard = ({
  post,
  canEdit = false,
  canDelete = false,
  liking = false,
  deleting = false,
  onLike,
  onEdit,
  onDelete,
  children,
}) => {
  const sourceType = post?.sourceType?.toUpperCase?.() ?? "MANUAL";
  const isJobPost = sourceType === "JOB";
  const likedByCurrentUser = isLikedByCurrentUser(post);

  return (
    <article className="feed-post-card">
      <div className="feed-post-card__header">
        <div>
          {isJobPost && (
            <div className="feed-post-card__source">
              <SourceBadge sourceType={sourceType} />
              <span>Created from a job event</span>
            </div>
          )}
          <p className="feed-post-card__author">{post?.authorEmail || "Unknown author"}</p>
        </div>
        <span className="feed-post-card__date">{formatDateTime(post?.createdAt)}</span>
      </div>

      <p className="feed-post-card__content">{post?.content || "No content provided."}</p>

      {isJobPost && post?.sourceId && (
        <Link className="feed-post-card__job-link" to={`/jobs/${post.sourceId}`}>
          View related job
        </Link>
      )}

      <div className="feed-post-card__actions">
        <button
          className={`feed-button feed-button--secondary${likedByCurrentUser ? " feed-button--liked" : ""}`}
          type="button"
          onClick={() => onLike?.(post)}
          disabled={liking}
          title={likedByCurrentUser ? "Remove like" : "Like post"}
        >
          <Heart size={16} fill={likedByCurrentUser ? "currentColor" : "none"} aria-hidden="true" />
          {liking ? "Updating..." : `${getLikes(post)} likes`}
        </button>
        <Link className="feed-button feed-button--secondary" to={`/feed/posts/${post?.id}`}>
          <MessageCircle size={16} aria-hidden="true" />
          View details
        </Link>
        {canEdit && (
          <button
            className="feed-button feed-button--secondary"
            type="button"
            onClick={() => onEdit?.(post)}
            title="Edit post"
          >
            <Edit3 size={16} aria-hidden="true" />
            Edit
          </button>
        )}
        {canDelete && (
          <button
            className="feed-button feed-button--danger"
            type="button"
            onClick={() => onDelete?.(post)}
            disabled={deleting}
            title="Delete post"
          >
            <Trash2 size={16} aria-hidden="true" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {children}
    </article>
  );
};

export default PostCard;
