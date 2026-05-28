export const NOTIFICATIONS_UPDATED_EVENT = "decp:notifications-updated";

export const notifyNotificationsUpdated = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
};
