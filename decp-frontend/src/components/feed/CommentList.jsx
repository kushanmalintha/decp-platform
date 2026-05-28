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

const CommentList = ({ comments = [], loading = false, error = "" }) => {
  if (loading) {
    return <div className="feed-state">Loading comments...</div>;
  }

  if (error) {
    return <div className="form-error">{error}</div>;
  }

  if (comments.length === 0) {
    return <div className="feed-state">No comments yet.</div>;
  }

  return (
    <div className="feed-comments-list">
      {comments.map((comment, index) => (
        <article className="feed-comment" key={comment.id ?? `${comment.authorEmail}-${comment.createdAt}-${index}`}>
          <div className="feed-comment__meta">
            <strong>{comment.authorEmail || "Unknown author"}</strong>
            <span>{formatDateTime(comment.createdAt)}</span>
          </div>
          <p>{comment.content || "No content provided."}</p>
        </article>
      ))}
    </div>
  );
};

export default CommentList;
