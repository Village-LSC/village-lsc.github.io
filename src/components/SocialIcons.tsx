import React from 'react';
import { Mail } from 'lucide-react';
import { SocialLinkItem } from '../data/portfolioData';

export function SocialIcon({
  id,
  className = 'w-5 h-5',
}: {
  id: SocialLinkItem['id'];
  className?: string;
}) {
  switch (id) {
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M21.9 3.6c-.4-.3-1-.4-1.6-.2L2.9 10.1c-.8.3-1.3.8-1.2 1.4.1.6.6 1 1.4 1.3l4.4 1.4 1.7 5.3c.2.6.6 1 1.1 1 .4 0 .8-.2 1.2-.6l2.5-2.5 4.4 3.2c.4.3.8.4 1.2.4.7 0 1.2-.5 1.4-1.3l2.9-14.4c.2-.7-.1-1.3-.6-1.7zM9.7 13.7l-.5 3.6-1.1-3.6 9.9-6.2-8.3 6.2z" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.3 5.3A16 16 0 0 0 15.3 4l-.5 1a14.7 14.7 0 0 0-5.6 0l-.5-1a16 16 0 0 0-4 1.3C2.2 9.1 1.5 12.8 1.9 16.4a16.2 16.2 0 0 0 4.9 2.5l1-1.7a10.4 10.4 0 0 1-1.7-.8l.4-.3a11.5 11.5 0 0 0 11 0l.4.3a10.4 10.4 0 0 1-1.7.8l1 1.7a16.2 16.2 0 0 0 4.9-2.5c.4-4.2-.7-7.8-2.8-11.1zM8.7 14.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
        </svg>
      );
    case 'email':
      return <Mail className={className} aria-hidden="true" />;
    case 'boosty':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.6 2.2 6.8 13.1h4.1l-1.9 8.7 9.1-11.4h-4.5l2.2-8.2h-3.2z" />
        </svg>
      );
    case 'artstation':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M2.2 16.8 4 20c.3.5.9.8 1.5.8h10.2l-2.3-4H2.2zm18.9-.6L14 3.9c-.3-.5-.9-.9-1.5-.9H9.4l8.8 15.3 2.7-1.6c.4-.2.5-.7.2-1.5zM10.4 13.5 7.2 8 4 13.5h6.4z" />
        </svg>
      );
    case 'bluesky':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 11.4c-1.4-2.7-5-7.4-8.1-9.2C1.7 1 1 2.2 1 3.7c0 1.3.7 7.1 1.1 8.1 1 3 3.9 3.7 6.7 3.3-4.6.7-5.8 3.2-3.3 5.7 4.7 4.7 6.3-1.2 6.5-2.6.2 1.4 1.3 7.3 6.5 2.6 2.5-2.5 1.3-5-3.3-5.7 2.8.4 5.7-.3 6.7-3.3.4-1 1.1-6.8 1.1-8.1 0-1.5-.7-2.7-2.9-1.5-3.1 1.8-6.7 6.5-8.1 9.2z" />
        </svg>
      );
  }
}
