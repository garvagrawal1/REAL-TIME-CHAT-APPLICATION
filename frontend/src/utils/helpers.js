/**
 * Format timestamp for message bubbles (e.g., "3:45 PM")
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format date divider between message days (e.g., "Today", "Yesterday", "August 17, 2026")
 */
export const formatDateDivider = (dateString) => {
  if (!dateString) return '';
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(messageDate, today)) {
    return 'Today';
  } else if (isSameDay(messageDate, yesterday)) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
};

/**
 * Check if two dates fall on the same day
 */
export const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get user initials for fallback avatar (e.g. "Garv Agarwal" -> "GA")
 */
export const getUserInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generate a consistent vibrant gradient color based on user name/id
 */
export const getAvatarGradient = (seed = '') => {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-fuchsia-600',
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

/**
 * Copy text to clipboard with modern fallback
 */
export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  }
};

/**
 * Debounce helper function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Format typing indicator text from active typing users list
 */
export const formatTypingText = (typingUsers = [], currentUserId = '') => {
  const others = typingUsers.filter((u) => u.userId !== currentUserId);
  if (others.length === 0) return '';
  if (others.length === 1) return `${others[0].name || others[0].username} is typing...`;
  if (others.length === 2) return `${others[0].name || others[0].username} and ${others[1].name || others[1].username} are typing...`;
  return `${others[0].name || others[0].username} and ${others.length - 1} others are typing...`;
};
