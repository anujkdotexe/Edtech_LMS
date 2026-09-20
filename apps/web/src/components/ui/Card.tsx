import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-100 rounded-2xl shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md transition' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
