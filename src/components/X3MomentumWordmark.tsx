'use client'

import Image from 'next/image'

interface X3MomentumWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function X3MomentumWordmark({ className = '', size = 'md' }: X3MomentumWordmarkProps) {
  const sizeClasses = {
    sm: 'w-32 h-8',
    md: 'w-48 h-12',
    lg: 'w-64 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="/X3-Momentum-Logo.svg"
        alt="X3 Momentum Pro"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
