import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Newspaper, PlusCircle, RefreshCw } from "lucide-react";

import { createPost, deletePost, getPosts, likePost, updatePost } from "../../api/feedApi";
import { useAuth } from "../../auth/useAuth";
import PostCard from "../../components/feed/PostCard";
import PostForm from "../../components/feed/PostForm";
import "./Feed.css";

const DEFAULT_FEED_QUERY = {
  page: 0,
  size: 10,
  sort: "createdAt,desc",
};

const normalizeRole = (role) => role?.toUpperCase?.() ?? "";

const isManualPost = (post) => (post?.sourceType?.toUpperCase?.() ?? "MANUAL") === "MANUAL";

const isOwner = (post, user) =>
  Boolean(post?.authorEmail && user?.email && post.authorEmail.toLowerCase() === user.email.toLowerCase());

const canCreatePost = (user) => ["STUDENT", "ALUMNI"].includes(normalizeRole(user?.role));

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
    return error.response?.data?.message ?? "Please check the post content and try again.";
  }

  return getErrorMessage(error, fallback);
};

const normalizePage = (pageData) => {
  if (Array.isArray(pageData)) {
    return {
      content: pageData,
      number: 0,
      totalPages: 1,
      first: true,
      last: true,
      totalElements: pageData.length,
    };
  }

  return {
    content: Array.isArray(pageData?.content) ? pageData.content : [],
    number: Number.isInteger(pageData?.number) ? pageData.number : 0,
    totalPages: Number.isInteger(pageData?.totalPages) ? pageData.totalPages : null,
    first: Boolean(pageData?.first),
    last: Boolean(pageData?.last),
    totalElements: Number.isInteger(pageData?.totalElements) ? pageData.totalElements : null,
  };
};

const updatePostInPage = (page, postId, updater) => {
  if (!page) {
    return page;
  }

  return {
    ...page,
    content: page.content.map((post) => (String(post.id) === String(postId) ? updater(post) : post)),
  };
};

const togglePostLike = (post) => ({
  ...post,
  likes: Math.max(0, Number(post?.likes ?? post?.likeCount ?? 0) + (post?.likedByCurrentUser ? -1 : 1)),
  likedByCurrentUser: !post?.likedByCurrentUser,
});

const getSourceType = (post) => post?.sourceType?.toUpperCase?.() ?? "MANUAL";

const Feed = () => {
  const { user } = useAuth();
  const [pageNumber, setPageNumber] = useState(DEFAULT_FEED_QUERY.page);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [reloadToken, setReloadToken] = useState(0);
  const [postsPage, setPostsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const query = useMemo(
    () => ({
      ...DEFAULT_FEED_QUERY,
      page: pageNumber,
    }),
    [pageNumber],
  );

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const pageData = await getPosts(query);

        if (isMounted) {
          setPostsPage(normalizePage(pageData));
        }
      } catch (loadError) {
        if (isMounted) {
          setPostsPage(null);
          setError(getErrorMessage(loadError, "Unable to load feed posts."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [query, reloadToken]);

  const handleCreatePost = async (data) => {
    setCreating(true);
    setSuccess("");
    setActionError("");

    try {
      await createPost(data);
      setSuccess("Post created successfully.");
      setPageNumber(0);
      setReloadToken((token) => token + 1);
      return true;
    } catch (createError) {
      setActionError(getMutationErrorMessage(createError, "Unable to create this post."));
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleLikePost = async (post) => {
    setActionError("");
    const originalPost = post;

    setPostsPage((currentPage) =>
      updatePostInPage(currentPage, post.id, (currentPost) => togglePostLike(currentPost)),
    );

    try {
      await likePost(post.id);
    } catch (likeError) {
      setPostsPage((currentPage) => updatePostInPage(currentPage, post.id, () => originalPost));
      setActionError(getMutationErrorMessage(likeError, "Unable to like this post."));
    }
  };

  const handleUpdatePost = async (post, data) => {
    if (!isManualPost(post)) {
      setActionError("Job-generated posts are updated through the job workflow.");
      return false;
    }

    setEditing(true);
    setSuccess("");
    setActionError("");

    try {
      const updatedPost = await updatePost(post.id, data);
      setPostsPage((currentPage) =>
        updatePostInPage(currentPage, post.id, (currentPost) => ({ ...currentPost, ...updatedPost, ...data })),
      );
      setEditingPostId(null);
      setSuccess("Post updated successfully.");
      return true;
    } catch (updateError) {
      setActionError(getMutationErrorMessage(updateError, "Unable to update this post."));
      return false;
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    setDeletingPostId(post.id);
    setSuccess("");
    setActionError("");

    try {
      await deletePost(post.id);
      setPostsPage((currentPage) => {
        if (!currentPage) {
          return currentPage;
        }

        return {
          ...currentPage,
          content: currentPage.content.filter((currentPost) => String(currentPost.id) !== String(post.id)),
          totalElements:
            Number.isInteger(currentPage.totalElements) && currentPage.totalElements > 0
              ? currentPage.totalElements - 1
              : currentPage.totalElements,
        };
      });
      setSuccess("Post deleted successfully.");
    } catch (deleteError) {
      setActionError(getMutationErrorMessage(deleteError, "Unable to delete this post."));
    } finally {
      setDeletingPostId(null);
    }
  };

  const posts = postsPage?.content ?? [];
  const visiblePosts = posts.filter((post) => sourceFilter === "ALL" || getSourceType(post) === sourceFilter);
  const manualCount = posts.filter((post) => getSourceType(post) === "MANUAL").length;
  const jobCount = posts.filter((post) => getSourceType(post) === "JOB").length;
  const currentPage = postsPage?.number ?? pageNumber;
  const totalPages = postsPage?.totalPages;
  const isFirstPage = currentPage <= 0 || postsPage?.first;
  const isLastPage =
    postsPage?.last || (Number.isInteger(totalPages) && totalPages > 0 && currentPage >= totalPages - 1);

  return (
    <section className="feed-page">
      <div className="feed-hero">
        <div>
          <p className="feed-eyebrow">Engagement</p>
          <h1>Follow department updates and career activity.</h1>
          <p>Use the feed to keep up with discussions, announcements, and job-generated updates.</p>
        </div>
        <button
          className="feed-button feed-button--secondary"
          type="button"
          onClick={() => setReloadToken((token) => token + 1)}
          disabled={loading}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {canCreatePost(user) && (
        <section className="feed-composer" aria-labelledby="create-post-heading">
          <div className="feed-composer__header">
            <div>
              <p className="feed-eyebrow">Share</p>
              <h2 id="create-post-heading">Create Post</h2>
            </div>
            <PlusCircle size={20} aria-hidden="true" />
          </div>
          <PostForm submitLabel="Create Post" submitting={creating} resetOnSuccess onSubmit={handleCreatePost} />
        </section>
      )}

      {success && <div className="form-success">{success}</div>}
      {actionError && <div className="form-error">{actionError}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="feed-summary" aria-label="Engagement feed summary">
        <button
          className={sourceFilter === "ALL" ? "is-active" : ""}
          type="button"
          onClick={() => setSourceFilter("ALL")}
        >
          <MessageCircle size={18} aria-hidden="true" />
          <span>All Updates</span>
          <strong>{posts.length}</strong>
        </button>
        <button
          className={sourceFilter === "MANUAL" ? "is-active" : ""}
          type="button"
          onClick={() => setSourceFilter("MANUAL")}
        >
          <Newspaper size={18} aria-hidden="true" />
          <span>Department Posts</span>
          <strong>{manualCount}</strong>
        </button>
        <button
          className={sourceFilter === "JOB" ? "is-active" : ""}
          type="button"
          onClick={() => setSourceFilter("JOB")}
        >
          <RefreshCw size={18} aria-hidden="true" />
          <span>Career Updates</span>
          <strong>{jobCount}</strong>
        </button>
      </div>

      {loading ? (
        <div className="feed-state">Loading feed posts...</div>
      ) : visiblePosts.length > 0 ? (
        <>
          <div className="feed-list">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canEdit={canEditPost(post, user)}
                canDelete={canDeletePost(post, user)}
                deleting={String(deletingPostId) === String(post.id)}
                onLike={handleLikePost}
                onEdit={() => setEditingPostId(post.id)}
                onDelete={handleDeletePost}
              >
                {String(editingPostId) === String(post.id) && (
                  <PostForm
                    initialContent={post.content}
                    submitLabel="Save Changes"
                    submitting={editing}
                    onSubmit={(data) => handleUpdatePost(post, data)}
                    onCancel={() => setEditingPostId(null)}
                  />
                )}
              </PostCard>
            ))}
          </div>

          <div className="feed-pagination" aria-label="Feed pagination">
            <button
              className="feed-button feed-button--secondary"
              type="button"
              onClick={() => setPageNumber((page) => Math.max(page - 1, 0))}
              disabled={isFirstPage || loading}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1}
              {Number.isInteger(totalPages) ? ` of ${totalPages}` : ""}
            </span>
            <button
              className="feed-button feed-button--secondary"
              type="button"
              onClick={() => setPageNumber((page) => page + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="feed-empty">
          <h2>No updates in this view</h2>
          <p>
            {posts.length > 0
              ? "Try another feed filter to see available updates."
              : "Posts, discussions, and job-generated updates will appear here when activity starts."}
          </p>
          {sourceFilter !== "ALL" && (
            <button className="feed-button feed-button--secondary" type="button" onClick={() => setSourceFilter("ALL")}>
              Show All Updates
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default Feed;
