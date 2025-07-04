
import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink = ({ href, children, className }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden",
        "focus:static focus:w-auto focus:h-auto focus:overflow-visible",
        "focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded",
        "focus:z-50 focus:outline-none focus:ring-2 focus:ring-white",
        className
      )}
      onFocus={(e) => {
        e.currentTarget.style.position = 'fixed';
        e.currentTarget.style.top = '0';
        e.currentTarget.style.left = '0';
        e.currentTarget.style.zIndex = '9999';
      }}
      onBlur={(e) => {
        e.currentTarget.style.position = 'absolute';
        e.currentTarget.style.left = '-10000px';
        e.currentTarget.style.top = 'auto';
      }}
    >
      {children}
    </a>
  );
};
