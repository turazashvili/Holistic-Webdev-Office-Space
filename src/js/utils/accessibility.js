/**
 * Accessibility Manager - Handles accessibility features and announcements
 */

export class AccessibilityManager {
    constructor() {
        this.announcer = null;
        this.focusHistory = [];
        this.trapStack = [];
    }

    /**
     * Initialize accessibility manager
     */
    init() {
        this.createAnnouncer();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        console.log('♿ Accessibility Manager initialized');
    }

    /**
     * Create screen reader announcer element
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.id = 'accessibility-announcer';
        document.body.appendChild(this.announcer);
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (!this.announcer) {
            this.createAnnouncer();
        }

        // Clear previous announcement
        this.announcer.textContent = '';
        
        // Set priority
        this.announcer.setAttribute('aria-live', priority);
        
        // Add new announcement after a brief delay to ensure it's read
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);

        // Clear announcement after it's been read
        setTimeout(() => {
            if (this.announcer.textContent === message) {
                this.announcer.textContent = '';
            }
        }, 3000);
    }

    /**
     * Set up keyboard navigation enhancements
     */
    setupKeyboardNavigation() {
        // Add visible focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Remove focus indicators when using mouse
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Handle escape key globally
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscape();
            }
        });
    }

    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.focusHistory.push(e.target);
            
            // Keep history manageable
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        });
    }

    /**
     * Handle escape key press
     */
    handleEscape() {
        // Close any open dropdowns, modals, etc.
        const openElements = document.querySelectorAll('[aria-expanded="true"]');
        openElements.forEach(element => {
            element.setAttribute('aria-expanded', 'false');
            
            // Hide associated content
            const controls = element.getAttribute('aria-controls');
            if (controls) {
                const controlled = document.getElementById(controls);
                if (controlled) {
                    controlled.hidden = true;
                }
            }
        });

        // Release focus trap if active
        if (this.trapStack.length > 0) {
            this.releaseFocusTrap();
        }
    }

    /**
     * Trap focus within an element
     */
    trapFocus(element) {
        if (!element) return;

        const focusableElements = this.getFocusableElements(element);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const trapHandler = (e) => {
            if (e.key === 'Tab') {
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
            }
        };

        element.addEventListener('keydown', trapHandler);
        
        // Store trap info
        this.trapStack.push({
            element,
            handler: trapHandler,
            previousFocus: document.activeElement
        });

        // Focus first element
        firstElement.focus();
    }

    /**
     * Release focus trap
     */
    releaseFocusTrap() {
        if (this.trapStack.length === 0) return;

        const trap = this.trapStack.pop();
        trap.element.removeEventListener('keydown', trap.handler);
        
        // Restore previous focus
        if (trap.previousFocus && typeof trap.previousFocus.focus === 'function') {
            trap.previousFocus.focus();
        }
    }

    /**
     * Get all focusable elements within a container
     */
    getFocusableElements(container) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors))
            .filter(element => {
                return element.offsetWidth > 0 && 
                       element.offsetHeight > 0 && 
                       !element.hidden;
            });
    }

    /**
     * Set focus to element with announcement
     */
    focusWithAnnouncement(element, announcement) {
        if (!element) return;

        element.focus();
        
        if (announcement) {
            this.announce(announcement);
        }
    }

    /**
     * Create skip link
     */
    createSkipLink(targetId, text = 'Skip to main content') {
        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.className = 'skip-nav';
        skipLink.textContent = text;
        
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });

        return skipLink;
    }

    /**
     * Add ARIA labels to elements
     */
    addAriaLabel(element, label) {
        if (!element) return;
        element.setAttribute('aria-label', label);
    }

    /**
     * Add ARIA description to elements
     */
    addAriaDescription(element, description) {
        if (!element) return;
        
        // Create description element if it doesn't exist
        let descId = element.getAttribute('aria-describedby');
        if (!descId) {
            descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const descElement = document.createElement('div');
            descElement.id = descId;
            descElement.className = 'sr-only';
            descElement.textContent = description;
            document.body.appendChild(descElement);
            
            element.setAttribute('aria-describedby', descId);
        }
    }

    /**
     * Update live region
     */
    updateLiveRegion(regionId, content, priority = 'polite') {
        let region = document.getElementById(regionId);
        
        if (!region) {
            region = document.createElement('div');
            region.id = regionId;
            region.setAttribute('aria-live', priority);
            region.setAttribute('aria-atomic', 'true');
            region.className = 'sr-only';
            document.body.appendChild(region);
        }

        region.textContent = content;
    }

    /**
     * Check color contrast ratio
     */
    checkColorContrast(foreground, background) {
        // Simple contrast ratio calculation
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            
            const [r, g, b] = rgb.map(c => {
                c = parseInt(c) / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        return {
            ratio: Math.round(ratio * 100) / 100,
            passAA: ratio >= 4.5,
            passAAA: ratio >= 7
        };
    }

    /**
     * Add keyboard support to custom elements
     */
    makeKeyboardAccessible(element, options = {}) {
        if (!element) return;

        const {
            role = 'button',
            activateKeys = ['Enter', ' '],
            onActivate = null
        } = options;

        // Add role and tabindex
        element.setAttribute('role', role);
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }

        // Add keyboard event listener
        element.addEventListener('keydown', (e) => {
            if (activateKeys.includes(e.key)) {
                e.preventDefault();
                if (onActivate) {
                    onActivate(e);
                } else {
                    element.click();
                }
            }
        });
    }

    /**
     * Validate accessibility of an element
     */
    validateElement(element) {
        const issues = [];

        // Check for missing alt text on images
        if (element.tagName === 'IMG' && !element.alt) {
            issues.push('Image missing alt text');
        }

        // Check for missing labels on form elements
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
            const hasLabel = element.labels && element.labels.length > 0;
            const hasAriaLabel = element.hasAttribute('aria-label');
            const hasAriaLabelledby = element.hasAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
                issues.push('Form element missing label');
            }
        }

        // Check for insufficient color contrast
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        if (color && backgroundColor && color !== backgroundColor) {
            const contrast = this.checkColorContrast(color, backgroundColor);
            if (!contrast.passAA) {
                issues.push(`Insufficient color contrast: ${contrast.ratio}:1`);
            }
        }

        return issues;
    }

    /**
     * Get accessibility summary for the page
     */
    getAccessibilitySummary() {
        const summary = {
            skipLinks: document.querySelectorAll('.skip-nav').length,
            headingStructure: this.analyzeHeadingStructure(),
            images: {
                total: document.querySelectorAll('img').length,
                withAlt: document.querySelectorAll('img[alt]').length,
                decorative: document.querySelectorAll('img[alt=""]').length
            },
            forms: {
                total: document.querySelectorAll('input, select, textarea').length,
                labeled: document.querySelectorAll('input[aria-label], input[aria-labelledby], select[aria-label], select[aria-labelledby], textarea[aria-label], textarea[aria-labelledby]').length + document.querySelectorAll('label').length
            },
            landmarks: document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').length
        };

        return summary;
    }

    /**
     * Analyze heading structure
     */
    analyzeHeadingStructure() {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const structure = {};
        
        headings.forEach(heading => {
            const level = heading.tagName.toLowerCase();
            structure[level] = (structure[level] || 0) + 1;
        });

        return structure;
    }
}
