import { useEffect, useCallback, useRef } from 'react';

export const useKeyboardNavigation = () => {
  const keyboardActiveRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detect keyboard navigation
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        if (!keyboardActiveRef.current) {
          keyboardActiveRef.current = true;
          document.body.classList.add('keyboard-navigation');
        }
      }
    };

    const handleMouseDown = () => {
      if (keyboardActiveRef.current) {
        keyboardActiveRef.current = false;
        document.body.classList.remove('keyboard-navigation');
      }
    };

    const handleTouchStart = () => {
      if (keyboardActiveRef.current) {
        keyboardActiveRef.current = false;
        document.body.classList.remove('keyboard-navigation');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return keyboardActiveRef.current;
};

// Hook for managing focus trap
export const useFocusTrap = (containerRef, isActive = true) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap activates
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts) => {
  const keysPressed = useRef(new Set());

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current.add(e.key.toLowerCase());

      // Check each shortcut
      shortcuts.forEach(({ keys, callback, preventDefault = true }) => {
        const allKeysPressed = keys.every(key => 
          keysPressed.current.has(key.toLowerCase())
        );

        if (allKeysPressed) {
          if (preventDefault) {
            e.preventDefault();
          }
          callback(e);
        }
      });
    };

    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
      keysPressed.current.clear();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [shortcuts]);
};

// Hook for arrow key navigation
export const useArrowKeyNavigation = (items, onSelect, options = {}) => {
  const { 
    vertical = true, 
    horizontal = false, 
    wrap = true,
    onEscape = null 
  } = options;
  
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback((e) => {
    if (!items || items.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        if (vertical) {
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev - 1;
            return wrap ? (newIndex < 0 ? items.length - 1 : newIndex) : Math.max(0, newIndex);
          });
        }
        break;

      case 'ArrowDown':
        if (vertical) {
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev + 1;
            return wrap ? (newIndex >= items.length ? 0 : newIndex) : Math.min(items.length - 1, newIndex);
          });
        }
        break;

      case 'ArrowLeft':
        if (horizontal) {
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev - 1;
            return wrap ? (newIndex < 0 ? items.length - 1 : newIndex) : Math.max(0, newIndex);
          });
        }
        break;

      case 'ArrowRight':
        if (horizontal) {
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev + 1;
            return wrap ? (newIndex >= items.length ? 0 : newIndex) : Math.min(items.length - 1, newIndex);
          });
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect && items[selectedIndex]) {
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;

      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;

      default:
        break;
    }
  }, [items, selectedIndex, onSelect, vertical, horizontal, wrap, onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { selectedIndex, setSelectedIndex };
};