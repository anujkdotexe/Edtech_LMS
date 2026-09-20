import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm disabled:opacity-50',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50',
    outline: 'border border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-xl font-semibold',
    lg: 'text-base px-6 py-3 rounded-xl font-bold',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.98] ${
        fullWidth ? 'w-full' : ''
      } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
