import { useState } from "react";

const CommentForm = ({ submitting = false, onSubmit }) => {
  const [content, setContent] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFieldError("Comment content is required.");
      return;
    }

    setFieldError("");
    const result = await onSubmit({ content: trimmedContent });

    if (result !== false) {
      setContent("");
    }
  };

  return (
    <form className="feed-comment-form" onSubmit={handleSubmit}>
      <label>
        Add a comment
        <textarea
          name="content"
          rows="3"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={submitting}
        />
      </label>
      {fieldError && <span className="field-error">{fieldError}</span>}
      <div className="feed-form__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
