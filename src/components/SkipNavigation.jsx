import React from 'react';
import { cn } from '../lib/utils';

/**
 * SkipNavigation Component
 * 
 * Provides accessible skip links for keyboard and screen reader users to bypass
 * repetitive navigation elements and jump directly to main content sections.
 * 
 * Features:
 * - WCAG 2.1 AA compliant skip links
 * - Keyboard navigation support with proper focus management
 * - Customizable target sections
 * - Hidden by default, visible on focus
 * - High contrast styling for accessibility
 * - Support for multiple skip targets
 * 
 * Usage:
 * Place this component at the very beginning of your app/page structure,
 * before any other interactive elements.
 */

const SkipNavigation = ({
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#sidebar', label: 'Skip to sidebar' }
  ],
  className = '',
  ...props
}) => {
  const handleSkipClick = (event, targetId) => {
    event.preventDefault();
    
    // Find the target element
    const target = document.querySelector(targetId);
    
    if (target) {
      // Set focus to the target element
      target.setAttribute('tabindex', '-1');
      target.focus();
      
      // Scroll target into view smoothly
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Remove tabindex after focus (to avoid affecting normal tab order)
      setTimeout(() => {
        target.removeAttribute('tabindex');
      }, 100);
    } else {
      // Fallback: scroll to top if target not found
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const skipLinkClasses = cn(
    // Base styling - hidden by default
    'sr-only focus:not-sr-only',
    
    // Position and layout
    'absolute top-4 left-4 z-[9999]',
    'inline-block',
    
    // Appearance
    'px-4 py-2 rounded-md',
    'bg-primary text-primary-foreground',
    'font-medium text-sm',
    'border-2 border-primary',
    'shadow-lg',
    
    // Focus styling
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'focus:ring-offset-background',
    
    // Hover and active states
    'hover:bg-primary/90',
    'active:bg-primary/80',
    
    // Transitions
    'transition-all duration-200 ease-in-out',
    
    // High contrast mode support handled via CSS
  );

  return (
    <nav 
      className={cn('skip-navigation', className)}
      aria-label="Skip navigation links"
      {...props}
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className={skipLinkClasses}
          onClick={(e) => handleSkipClick(e, link.href)}
          onKeyDown={(e) => {
            // Ensure Enter key works consistently
            if (e.key === 'Enter') {
              handleSkipClick(e, link.href);
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

/**
 * SkipTarget Component
 * 
 * Helper component to mark content sections as skip navigation targets.
 * Provides proper ARIA landmarks and ensures elements are focusable.
 */
export const SkipTarget = ({
  children,
  id,
  role = 'main',
  'aria-label': ariaLabel,
  className = '',
  ...props
}) => {
  const targetRef = React.useRef(null);

  React.useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Ensure the element can receive focus when needed
    const handleFocus = () => {
      // Add visual focus indicator for accessibility
      element.style.outline = '2px solid hsl(var(--ring))';
      element.style.outlineOffset = '2px';
    };

    const handleBlur = () => {
      // Remove visual focus indicator
      element.style.outline = '';
      element.style.outlineOffset = '';
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div
      ref={targetRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={cn('skip-target', className)}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Landmark Navigation Component
 * 
 * Creates a comprehensive navigation structure for screen readers
 * with proper ARIA landmarks and semantic elements.
 */
export const LandmarkNavigation = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <>
      <SkipNavigation />
      <div 
        className={cn('landmark-navigation', className)}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

/**
 * AccessibilityAnnouncer Component
 * 
 * Provides live region announcements for dynamic content changes
 * that should be communicated to screen reader users.
 */
export const AccessibilityAnnouncer = ({
  message = '',
  priority = 'polite', // 'polite' | 'assertive'
  clearDelay = 3000,
  className = '',
  ...props
}) => {
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear the message after a delay to avoid cluttering
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return (
    <div
      className={cn('sr-only', className)}
      aria-live={priority}
      aria-atomic="true"
      role="status"
      {...props}
    >
      {announcement}
    </div>
  );
};

/**
 * FocusManager Component
 * 
 * Utilities for managing focus in complex UIs, particularly useful
 * for modals, dropdowns, and dynamic content.
 */
export const useFocusManagement = () => {
  const trapFocus = React.useCallback((container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = React.useCallback((previousElement) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
};

export default SkipNavigation;