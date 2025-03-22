import React, { useEffect, useState } from 'react';

interface AccessibilityAnnouncementProps {
  message: string;
  assertive?: boolean;
  timeout?: number;
}

/**
 * Component for announcing changes to screen readers
 * Uses ARIA live regions to announce important changes
 */
const AccessibilityAnnouncement: React.FC<AccessibilityAnnouncementProps> = ({
  message,
  assertive = false,
  timeout = 3000
}) => {
  const [announcement, setAnnouncement] = useState<string>(message);

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear announcement after timeout to prevent repeated announcements
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [message, timeout]);

  return (
    <div 
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};

export default AccessibilityAnnouncement;