import React from 'react';

interface TampaIconProps {
  className?: string;
  removeBackground?: boolean;
}

export const TampaIcon: React.FC<TampaIconProps> = ({ className = "w-5 h-5", removeBackground = false }) => {
  if (removeBackground) {
    return (
      <img 
        src="/tampa-logo.png" 
        alt="Tampa APP" 
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  
  return (
    <div className="bg-white rounded-lg flex items-center justify-center p-1">
      <img 
        src="/tampa-logo.png" 
        alt="Tampa APP" 
        className={className}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};
