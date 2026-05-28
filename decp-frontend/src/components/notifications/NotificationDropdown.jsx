import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";

import { getUnreadNotifications, markAllNotificationsAsRead } from "../../api/notificationApi";
import NotificationBadge from "./NotificationBadge";
import { notifyNotificationsUpdated } from "./notificationEvents";

const normalizeUnreadNotifications = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  return [];
};

const NotificationDropdown = () => {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isMounted = true;

    const loadUnreadNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const unreadData = await getUnreadNotifications();

        if (isMounted) {
          setNotifications(normalizeUnreadNotifications(unreadData).slice(0, 5));
        }
      } catch (loadError) {
        if (isMounted) {
          setNotifications([]);
          setError(loadError.response?.data?.message ?? "Unable to load unread notifications.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUnreadNotifications();

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    setError("");

    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      notifyNotificationsUpdated();
    } catch (markError) {
      setError(markError.response?.data?.message ?? "Unable to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-dropdown__trigger"
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-expanded={open}
        aria-label="Open notifications"
        title="Notifications"
      >
        <Bell size={18} aria-hidden="true" />
        <NotificationBadge compact />
      </button>

      {open && (
        <div className="notification-dropdown__menu">
          <div className="notification-dropdown__header">
            <strong>Unread Notifications</strong>
            {notifications.length > 0 && (
              <button
                className="notification-dropdown__mark-all"
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                title="Mark all notifications as read"
              >
                <CheckCheck size={15} aria-hidden="true" />
                {markingAll ? "Marking..." : "Mark All"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="notification-dropdown__state">Loading...</div>
          ) : error ? (
            <div className="notification-dropdown__state notification-dropdown__state--error">{error}</div>
          ) : notifications.length > 0 ? (
            <div className="notification-dropdown__list">
              {notifications.map((notification) => (
                <Link
                  className="notification-dropdown__item"
                  key={notification.id ?? notification.notificationId}
                  to="/notifications"
                  onClick={() => setOpen(false)}
                >
                  <strong>{notification.title || "Notification"}</strong>
                  <span>{notification.message || "No message provided."}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="notification-dropdown__state">No unread notifications.</div>
          )}

          <Link className="notification-dropdown__view-all" to="/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
