import { useEffect, useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../api/notificationApi";
import NotificationCard from "../../components/notifications/NotificationCard";
import { notifyNotificationsUpdated } from "../../components/notifications/notificationEvents";
import "./Notifications.css";

const DEFAULT_NOTIFICATION_QUERY = {
  page: 0,
  size: 10,
  sort: "createdAt,desc",
};

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

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

const getNotificationId = (notification) => notification?.id ?? notification?.notificationId;

const markNotificationReadLocally = (notification) => ({
  ...notification,
  isRead: true,
  read: true,
});

const updateNotificationInPage = (page, notificationId, updater) => {
  if (!page) {
    return page;
  }

  return {
    ...page,
    content: page.content.map((notification) =>
      String(getNotificationId(notification)) === String(notificationId) ? updater(notification) : notification,
    ),
  };
};

const markAllNotificationsReadLocally = (page) => {
  if (!page) {
    return page;
  }

  return {
    ...page,
    content: page.content.map(markNotificationReadLocally),
  };
};

const Notifications = () => {
  const [pageNumber, setPageNumber] = useState(DEFAULT_NOTIFICATION_QUERY.page);
  const [notificationsPage, setNotificationsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const query = useMemo(
    () => ({
      ...DEFAULT_NOTIFICATION_QUERY,
      page: pageNumber,
    }),
    [pageNumber],
  );

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const pageData = await getNotifications(query);

        if (isMounted) {
          setNotificationsPage(normalizePage(pageData));
          notifyNotificationsUpdated();
        }
      } catch (loadError) {
        if (isMounted) {
          setNotificationsPage(null);
          setError(getErrorMessage(loadError, "Unable to load notifications."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleMarkAsRead = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notificationId) {
      setActionError("Unable to identify this notification.");
      return;
    }

    setMarkingNotificationId(notificationId);
    setSuccess("");
    setActionError("");

    try {
      await markNotificationAsRead(notificationId);
      setNotificationsPage((currentPage) =>
        updateNotificationInPage(currentPage, notificationId, markNotificationReadLocally),
      );
      notifyNotificationsUpdated();
      setSuccess("Notification marked as read.");
    } catch (markError) {
      setActionError(getErrorMessage(markError, "Unable to mark this notification as read."));
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    setSuccess("");
    setActionError("");

    try {
      await markAllNotificationsAsRead();
      setNotificationsPage(markAllNotificationsReadLocally);
      notifyNotificationsUpdated();
      setSuccess("All notifications marked as read.");
    } catch (markError) {
      setActionError(getErrorMessage(markError, "Unable to mark all notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  const notifications = notificationsPage?.content ?? [];
  const currentPage = notificationsPage?.number ?? pageNumber;
  const totalPages = notificationsPage?.totalPages;
  const isFirstPage = currentPage <= 0 || notificationsPage?.first;
  const isLastPage =
    notificationsPage?.last || (Number.isInteger(totalPages) && totalPages > 0 && currentPage >= totalPages - 1);

  return (
    <section className="notifications-page">
      <div className="notifications-page__header">
        <div>
          <h1>Notifications</h1>
          <p>Review updates and alerts sent to your account.</p>
        </div>
        <button
          className="notification-button"
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={markingAll || loading || notifications.length === 0}
          title="Mark all notifications as read"
        >
          <CheckCheck size={16} aria-hidden="true" />
          {markingAll ? "Marking..." : "Mark All as Read"}
        </button>
      </div>

      {success && <div className="form-success">{success}</div>}
      {actionError && <div className="form-error">{actionError}</div>}
      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="notification-state">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <>
          <div className="notification-list">
            {notifications.map((notification) => (
              <NotificationCard
                key={getNotificationId(notification)}
                notification={notification}
                markingRead={String(markingNotificationId) === String(getNotificationId(notification))}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>

          <div className="notification-pagination" aria-label="Notifications pagination">
            <button
              className="notification-button notification-button--secondary"
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
              className="notification-button notification-button--secondary"
              type="button"
              onClick={() => setPageNumber((page) => page + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="notification-state">No notifications yet.</div>
      )}
    </section>
  );
};

export default Notifications;
