'use client'

interface X3MomentumWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function X3MomentumWordmark({ className = '', size = 'md' }: X3MomentumWordmarkProps) {
  const sizeClasses = {
    sm: 'w-32 h-6',
    md: 'w-48 h-10',
    lg: 'w-64 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            {`
              .wordmark-text {
                font-family: 'Inter', 'Gotham', 'Montserrat', sans-serif;
                font-weight: 900;
                font-size: 48px;
                letter-spacing: -1px;
                text-anchor: start;
                dominant-baseline: central;
              }
              .x3-color { fill: #FF6B35; }
              .momentum-color { fill: #D32F2F; }
            `}
          </style>
        </defs>
        
        {/* X3 in Fire Orange */}
        <text x="20" y="40" className="wordmark-text x3-color">X3</text>
        
        {/* MOMENTUM in Ember Red */}
        <text x="100" y="40" className="wordmark-text momentum-color">MOMENTUM</text>
      </svg>
    </div>
  );
}