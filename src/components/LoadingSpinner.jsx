import React from 'react';
import { cn } from '../lib/utils';

/**
 * LoadingSpinner Component
 * 
 * A production-ready loading spinner with accessibility features, animation controls,
 * and support for different sizes and variants. Optimized for both light and dark themes
 * with smooth animations and proper ARIA attributes.
 * 
 * Features:
 * - Multiple size variants (xs, sm, md, lg, xl)
 * - Accessibility compliant with ARIA labels and live regions
 * - Respects prefers-reduced-motion for accessibility
 * - Hardware accelerated animations for smooth performance
 * - Custom colors and styling support
 * - Optional text labels and descriptions
 */

const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
  description = null,
  showLabel = false,
  color = null,
  speed = 'normal',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Color variants using CSS custom properties
  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    muted: 'text-muted-foreground',
    accent: 'text-accent-foreground'
  };

  // Animation speed variants
  const speedClasses = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
  };

  // Generate unique IDs for accessibility
  const spinnerId = React.useId();
  const descriptionId = description ? `${spinnerId}-desc` : undefined;

  const spinnerClasses = cn(
    // Base classes
    'inline-block rounded-full border-2 border-solid',
    'border-current border-r-transparent',
    'loading-spinner', // Custom utility class for hardware acceleration
    
    // Size
    sizeClasses[size],
    
    // Color variant
    color ? '' : variantClasses[variant],
    
    // Animation speed
    speedClasses[speed],
    
    // Custom className
    className
  );

  const containerClasses = cn(
    'flex items-center justify-center',
    showLabel && 'gap-2'
  );

  const customStyle = color ? { color } : undefined;

  return (
    <div 
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <div
        id={spinnerId}
        className={spinnerClasses}
        style={customStyle}
        aria-label={ariaLabel || label}
        aria-describedby={ariaDescribedBy || descriptionId}
      />
      
      {showLabel && (
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      )}
      
      {description && (
        <span 
          id={descriptionId}
          className="sr-only"
        >
          {description}
        </span>
      )}
      
      {/* Screen reader fallback text */}
      <span className="sr-only">
        {label}
        {description && `. ${description}`}
      </span>
    </div>
  );
};

/**
 * LoadingDots Component
 * 
 * Alternative loading animation using dots for variety
 */
export const LoadingDots = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-muted-foreground',
    success: 'bg-green-600 dark:bg-green-400',
    warning: 'bg-amber-600 dark:bg-amber-400',
    danger: 'bg-red-600 dark:bg-red-400',
    info: 'bg-blue-600 dark:bg-blue-400',
    muted: 'bg-muted-foreground',
    accent: 'bg-accent-foreground'
  };

  const dotClasses = cn(
    'rounded-full',
    sizeClasses[size],
    variantClasses[variant]
  );

  return (
    <div 
      className={cn('flex items-center justify-center gap-1', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      {...props}
    >
      <div className={cn(dotClasses, 'animate-bounce [animation-delay:-0.3s]')} />
      <div className={cn(dotClasses, 'animate-bounce [animation-delay:-0.15s]')} />
      <div className={cn(dotClasses, 'animate-bounce')} />
      
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * LoadingPulse Component
 * 
 * Subtle pulse animation for loading states
 */
export const LoadingPulse = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'bg-primary/20 border-primary/40',
    secondary: 'bg-muted-foreground/20 border-muted-foreground/40',
    success: 'bg-green-600/20 border-green-600/40',
    warning: 'bg-amber-600/20 border-amber-600/40',
    danger: 'bg-red-600/20 border-red-600/40',
    info: 'bg-blue-600/20 border-blue-600/40',
    muted: 'bg-muted-foreground/20 border-muted-foreground/40',
    accent: 'bg-accent-foreground/20 border-accent-foreground/40'
  };

  const pulseClasses = cn(
    'rounded-full border-2 animate-pulse',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  return (
    <div 
      className={pulseClasses}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * LoadingOverlay Component
 * 
 * Full-screen or container overlay with loading spinner
 */
export const LoadingOverlay = ({
  children,
  loading = true,
  backdrop = true,
  blur = true,
  className = '',
  spinnerProps = {},
  ...props
}) => {
  if (!loading) return children;

  const overlayClasses = cn(
    'absolute inset-0 z-50 flex items-center justify-center',
    backdrop && 'bg-background/80',
    blur && 'backdrop-blur-sm',
    className
  );

  return (
    <div className="relative" {...props}>
      {children}
      <div className={overlayClasses}>
        <LoadingSpinner 
          size="lg"
          variant="primary"
          showLabel
          {...spinnerProps}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;