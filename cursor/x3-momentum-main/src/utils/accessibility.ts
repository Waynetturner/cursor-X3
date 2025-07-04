
// Utility functions for accessibility
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const generateId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Screen reader only text utility
export const srOnlyStyles = "absolute left-[-10000px] top-auto width-[1px] height-[1px] overflow-hidden";
