import { useEffect, useMemo, useState } from "react";

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

const Feed = () => {
  const { user } = useAuth();
  const [pageNumber, setPageNumber] = useState(DEFAULT_FEED_QUERY.page);
  const [reloadToken, setReloadToken] = useState(0);
  const [postsPage, setPostsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [likingPostId, setLikingPostId] = useState(null);
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
    setLikingPostId(post.id);
    setActionError("");

    try {
      const likedPost = await likePost(post.id);
      setPostsPage((currentPage) =>
        updatePostInPage(currentPage, post.id, (currentPost) =>
          mergePostResponse(currentPost, likedPost, currentPost?.likedByCurrentUser ? -1 : 1),
        ),
      );
    } catch (likeError) {
      setActionError(getMutationErrorMessage(likeError, "Unable to like this post."));
    } finally {
      setLikingPostId(null);
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
  const currentPage = postsPage?.number ?? pageNumber;
  const totalPages = postsPage?.totalPages;
  const isFirstPage = currentPage <= 0 || postsPage?.first;
  const isLastPage =
    postsPage?.last || (Number.isInteger(totalPages) && totalPages > 0 && currentPage >= totalPages - 1);

  return (
    <section className="feed-page">
      <div className="feed-page__header">
        <div>
          <h1>Feed</h1>
          <p>Follow updates from manual posts and job activity.</p>
        </div>
      </div>

      {canCreatePost(user) && (
        <section className="feed-composer" aria-labelledby="create-post-heading">
          <h2 id="create-post-heading">Create Post</h2>
          <PostForm submitLabel="Create Post" submitting={creating} resetOnSuccess onSubmit={handleCreatePost} />
        </section>
      )}

      {success && <div className="form-success">{success}</div>}
      {actionError && <div className="form-error">{actionError}</div>}
      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="feed-state">Loading feed posts...</div>
      ) : posts.length > 0 ? (
        <>
          <div className="feed-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canEdit={canEditPost(post, user)}
                canDelete={canDeletePost(post, user)}
                liking={String(likingPostId) === String(post.id)}
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
        <div className="feed-state">No feed posts yet.</div>
      )}
    </section>
  );
};

export default Feed;
