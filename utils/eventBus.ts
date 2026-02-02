export const triggerRefreshUnreadCount = () => {
  const event = new Event('REFRESH_UNREAD_COUNT');
  window.dispatchEvent(event);
};