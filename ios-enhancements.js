// iOS-Specific Enhancements for Claude Code UI
// This script adds additional iOS optimizations and features

// Detect iOS devices
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isIPad = /iPad/.test(navigator.userAgent);
const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

// iOS Viewport Height Fix
// Handles the dynamic viewport height on iOS Safari
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// iOS Safe Area Handling
function setupSafeAreas() {
    if (isIOS) {
        // Add iOS-specific classes
        document.body.classList.add('ios-device');
        if (isIPad) {
            document.body.classList.add('ipad-device');
        }
        if (isStandalone) {
            document.body.classList.add('ios-standalone');
        }

        // Handle safe area insets
        const root = document.documentElement;
        const safeAreaInsets = {
            top: parseInt(getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0'),
            right: parseInt(getComputedStyle(root).getPropertyValue('env(safe-area-inset-right)') || '0'),
            bottom: parseInt(getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0'),
            left: parseInt(getComputedStyle(root).getPropertyValue('env(safe-area-inset-left)') || '0')
        };

        // Apply safe area padding
        document.body.style.paddingTop = `${safeAreaInsets.top}px`;
        document.body.style.paddingBottom = `${safeAreaInsets.bottom}px`;
    }
}

// Prevent iOS bounce effect
function preventBounce() {
    if (isIOS) {
        let startY = 0;
        
        document.addEventListener('touchstart', function(e) {
            startY = e.touches[0].pageY;
        }, { passive: true });

        document.addEventListener('touchmove', function(e) {
            const y = e.touches[0].pageY;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
            const height = window.innerHeight;

            // Prevent overscroll at top and bottom
            if ((scrollTop <= 0 && y > startY) || 
                (scrollTop + height >= scrollHeight && y < startY)) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// iOS Keyboard Handling
function setupKeyboardHandling() {
    if (isIOS) {
        let keyboardHeight = 0;
        let originalHeight = window.innerHeight;

        // Detect keyboard show/hide
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            
            if (currentHeight < originalHeight * 0.75) {
                // Keyboard is likely visible
                keyboardHeight = originalHeight - currentHeight;
                document.body.classList.add('ios-keyboard-visible');
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('ios-keyboard-show', { 
                    detail: { height: keyboardHeight } 
                }));
            } else {
                // Keyboard is likely hidden
                document.body.classList.remove('ios-keyboard-visible');
                document.documentElement.style.setProperty('--keyboard-height', '0px');
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('ios-keyboard-hide'));
            }
            
            // Update viewport height
            setViewportHeight();
        });

        // Auto-scroll to focused input
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea')) {
                setTimeout(() => {
                    e.target.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            }
        });
    }
}

// Touch Optimization
function optimizeTouchTargets() {
    if (isIOS) {
        // Add iOS-specific touch handling
        const style = document.createElement('style');
        style.textContent = `
            /* iOS Touch Optimizations */
            .ios-device button,
            .ios-device a,
            .ios-device [role="button"] {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
                touch-action: manipulation;
                min-height: 44px;
                min-width: 44px;
            }

            /* Prevent text selection on buttons */
            .ios-device button,
            .ios-device [role="button"] {
                -webkit-user-select: none;
                user-select: none;
            }

            /* Optimize scrolling */
            .ios-device .scroll-container {
                -webkit-overflow-scrolling: touch;
                overflow-y: auto;
            }

            /* Fix position during keyboard */
            .ios-keyboard-visible .mobile-nav-container {
                position: absolute;
                bottom: var(--keyboard-height, 0);
            }

            /* Safe area padding */
            .ios-device {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }

            /* Standalone mode adjustments */
            .ios-standalone {
                padding-top: calc(env(safe-area-inset-top) + 20px);
            }

            /* Viewport height fix */
            .ios-device .full-height {
                height: calc(var(--vh, 1vh) * 100);
            }
        `;
        document.head.appendChild(style);
    }
}

// PWA Install Prompt
function setupPWAInstall() {
    if (isIOS && !isStandalone) {
        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const lastPrompt = localStorage.getItem('pwa-install-last-prompt');
        const now = Date.now();
        
        // Show prompt after 30 seconds, and not more than once per week
        if (!dismissed && (!lastPrompt || now - lastPrompt > 7 * 24 * 60 * 60 * 1000)) {
            setTimeout(() => {
                showIOSInstallPrompt();
            }, 30000);
        }
    }
}

function showIOSInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'ios-install-prompt';
    prompt.innerHTML = `
        <div class="ios-install-content">
            <h3>Install Claude Code UI</h3>
            <p>Add to your home screen for the best experience</p>
            <ol>
                <li>Tap the Share button <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3l-1.5 1.5L9 5V11h2V5l.5-.5L10 3z"/>
                    <path d="M15 7v8a2 2 0 01-2 2H7a2 2 0 01-2-2V7h2v8h6V7h2z"/>
                </svg></li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add"</li>
            </ol>
            <button class="ios-install-dismiss">Maybe Later</button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .ios-install-prompt {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .ios-install-content h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }

        .ios-install-content p {
            margin: 0 0 15px 0;
            color: #666;
        }

        .ios-install-content ol {
            margin: 0 0 15px 0;
            padding-left: 20px;
        }

        .ios-install-content li {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .ios-install-dismiss {
            width: 100%;
            padding: 12px;
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }

        .dark .ios-install-prompt {
            background: #1f2937;
            color: white;
        }

        .dark .ios-install-content p {
            color: #9ca3af;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(prompt);

    // Handle dismiss
    prompt.querySelector('.ios-install-dismiss').addEventListener('click', () => {
        prompt.remove();
        style.remove();
        localStorage.setItem('pwa-install-last-prompt', Date.now().toString());
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
        if (prompt.parentNode) {
            prompt.remove();
            style.remove();
        }
    }, 30000);
}

// Performance Optimizations
function setupPerformanceOptimizations() {
    if (isIOS) {
        // Disable hover effects on iOS
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) {
                .ios-device *:hover {
                    opacity: 1 !important;
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Optimize animations for iOS
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        }
    }
}

// Initialize all iOS enhancements
function initializeIOSEnhancements() {
    if (isIOS) {
        console.log('Initializing iOS enhancements...');
        
        // Set up all enhancements
        setViewportHeight();
        setupSafeAreas();
        preventBounce();
        setupKeyboardHandling();
        optimizeTouchTargets();
        setupPWAInstall();
        setupPerformanceOptimizations();

        // Update viewport height on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });

        // Update viewport height on resize
        window.addEventListener('resize', setViewportHeight);

        console.log('iOS enhancements initialized');
    }
}

// Export for use in React components
export {
    isIOS,
    isIPad,
    isStandalone,
    initializeIOSEnhancements,
    setViewportHeight,
    showIOSInstallPrompt
};

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined' && window.document) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeIOSEnhancements);
    } else {
        initializeIOSEnhancements();
    }
}