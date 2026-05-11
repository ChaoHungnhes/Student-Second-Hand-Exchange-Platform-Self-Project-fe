export const triggerRefreshUnreadCount = () => {
  const event = new Event('REFRESH_UNREAD_COUNT');
  window.dispatchEvent(event);
};

export const triggerRefreshNotificationUnreadCount = () => {
  const event = new Event('REFRESH_NOTIFICATION_UNREAD_COUNT');
  window.dispatchEvent(event);
};
