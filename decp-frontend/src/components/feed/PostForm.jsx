import { useState } from "react";

const PostForm = ({
  initialContent = "",
  submitLabel = "Post",
  submitting = false,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}) => {
  const [content, setContent] = useState(initialContent);
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFieldError("Post content is required.");
      return;
    }

    setFieldError("");
    const result = await onSubmit({ content: trimmedContent });

    if (resetOnSuccess && result !== false) {
      setContent("");
    }
  };

  return (
    <form className="feed-form" onSubmit={handleSubmit}>
      <label>
        Content
        <textarea
          name="content"
          rows="4"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={submitting}
        />
      </label>
      {fieldError && <span className="field-error">{fieldError}</span>}
      <div className="feed-form__actions">
        {onCancel && (
          <button
            className="feed-button feed-button--secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
