import { Check } from "lucide-react";

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

const normalizeType = (type) => (type ? String(type).replaceAll("_", " ") : "General");

const NotificationCard = ({ notification, markingRead = false, onMarkAsRead }) => {
  const isRead = Boolean(notification?.isRead ?? notification?.read);
  const notificationId = notification?.id ?? notification?.notificationId;

  return (
    <article className={`notification-card${isRead ? "" : " notification-card--unread"}`}>
      <div className="notification-card__header">
        <div className="notification-card__title-row">
          <h2>{notification?.title || "Notification"}</h2>
          <span className="notification-card__type">{normalizeType(notification?.type)}</span>
        </div>
        <span className={`notification-card__status${isRead ? "" : " notification-card__status--unread"}`}>
          {isRead ? "Read" : "Unread"}
        </span>
      </div>

      <p className="notification-card__message">{notification?.message || "No message provided."}</p>

      <div className="notification-card__footer">
        <span>{formatDateTime(notification?.createdAt)}</span>
        {!isRead && (
          <button
            className="notification-button notification-button--secondary"
            type="button"
            onClick={() => onMarkAsRead?.(notification)}
            disabled={markingRead || !notificationId}
            title="Mark notification as read"
          >
            <Check size={16} aria-hidden="true" />
            {markingRead ? "Marking..." : "Mark as Read"}
          </button>
        )}
      </div>
    </article>
  );
};

export default NotificationCard;
