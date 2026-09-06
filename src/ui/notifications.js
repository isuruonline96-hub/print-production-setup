/**
 * Notification System
 * 
 * Displays warnings, errors, and success messages to the user.
 */

let notificationContainer = null;

/**
 * Initialize the notification system.
 * @param {HTMLElement} container - The container element for notifications.
 */
export function initNotifications(container) {
  notificationContainer = container;
}

/**
 * Show a notification message.
 * 
 * @param {string} message - The message text.
 * @param {'info'|'success'|'warning'|'error'} type - The notification type.
 * @param {number} duration - Auto-dismiss duration in ms (0 = manual dismiss).
 */
export function showNotification(message, type = 'info', duration = 5000) {
  if (!notificationContainer) return;
  
  const icons = {
    info: '&#9432;',
    success: '&#10003;',
    warning: '&#9888;',
    error: '&#10007;',
  };
  
  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.innerHTML = `
    <span class="notification-icon">${icons[type]}</span>
    <span class="notification-text">${message}</span>
    <button class="notification-close" aria-label="Dismiss">&times;</button>
  `;
  
  const closeBtn = el.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    el.classList.add('notification-exit');
    setTimeout(() => el.remove(), 300);
  });
  
  notificationContainer.appendChild(el);
  
  // Trigger entrance animation
  requestAnimationFrame(() => el.classList.add('notification-enter'));
  
  if (duration > 0) {
    setTimeout(() => {
      if (el.parentNode) {
        el.classList.add('notification-exit');
        setTimeout(() => el.remove(), 300);
      }
    }, duration);
  }
}

/**
 * Clear all notifications.
 */
export function clearNotifications() {
  if (notificationContainer) {
    notificationContainer.innerHTML = '';
  }
}
