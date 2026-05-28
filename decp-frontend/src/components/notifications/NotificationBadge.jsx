import { useCallback, useEffect, useState } from "react";

import { getUnreadNotificationCount } from "../../api/notificationApi";
import { NOTIFICATIONS_UPDATED_EVENT } from "./notificationEvents";

const normalizeCount = (countData) => {
  if (typeof countData === "number") {
    return countData;
  }

  if (typeof countData === "string") {
    const parsedCount = Number(countData);
    return Number.isNaN(parsedCount) ? 0 : parsedCount;
  }

  return Number(countData?.count ?? countData?.unreadCount ?? countData?.total ?? 0);
};

const NotificationBadge = ({ compact = false, onCountChange }) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    setLoading(true);

    try {
      const countData = await getUnreadNotificationCount();
      const nextCount = Math.max(normalizeCount(countData), 0);
      setCount(nextCount);
      onCountChange?.(nextCount);
    } catch {
      setCount(0);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    const initialTimerId = window.setTimeout(loadCount, 0);

    const intervalId = window.setInterval(loadCount, 45000);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadCount);

    return () => {
      window.clearTimeout(initialTimerId);
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadCount);
    };
  }, [loadCount]);

  if (count <= 0) {
    return compact ? null : (
      <span className="notification-badge notification-badge--neutral" aria-label="No unread notifications">
        0
      </span>
    );
  }

  return (
    <span
      className={`notification-badge${loading ? " notification-badge--loading" : ""}`}
      aria-label={`${count} unread notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;
