/**
 * Navbar functionality for Smart Day-Starter Dashboard
 * Handles real-time clock and About button
 */

class NavbarManager {
    constructor() {
        this.timeElement = null;
        this.dateElement = null;
        this.aboutButton = null;
        this.clockInterval = null;
    }

    /**
     * Initialize navbar functionality
     */
    init() {
        this.timeElement = document.getElementById('current-time');
        this.dateElement = document.getElementById('current-date');
        this.aboutButton = document.querySelector('.header__about');

        if (this.timeElement && this.dateElement) {
            this.startClock();
        }

        if (this.aboutButton) {
            this.setupAboutButton();
        }

        console.log('📱 Navbar initialized with real-time clock');
    }

    /**
     * Start the real-time clock
     */
    startClock() {
        // Update immediately
        this.updateDateTime();
        
        // Update every second
        this.clockInterval = setInterval(() => {
            this.updateDateTime();
        }, 1000);
    }

    /**
     * Update the time and date display
     */
    updateDateTime() {
        const now = new Date();
        
        // Format time (12-hour format with AM/PM)
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        
        // Format date
        const dateOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        // Update DOM elements
        if (this.timeElement) {
            this.timeElement.textContent = timeString;
        }
        
        if (this.dateElement) {
            this.dateElement.textContent = dateString;
        }
    }

    /**
     * Setup About button functionality
     */
    setupAboutButton() {
        this.aboutButton.addEventListener('click', () => {
            this.showAboutModal();
        });

        // Keyboard support
        this.aboutButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showAboutModal();
            }
        });
    }

    /**
     * Show About modal
     */
    showAboutModal() {
        const modal = document.createElement('div');
        modal.className = 'about-modal';
        modal.innerHTML = `
            <div class="about-modal__backdrop"></div>
            <div class="about-modal__content" role="dialog" aria-labelledby="about-modal-title" aria-modal="true">
                <div class="about-modal__header">
                    <h3 id="about-modal-title">About Smart Day-Starter Dashboard</h3>
                    <button class="about-modal__close" aria-label="Close about dialog">×</button>
                </div>
                <div class="about-modal__body">
                    <div class="about-info">
                        <div class="about-logo">🚀</div>
                        <h4>Smart Day-Starter Dashboard</h4>
                        <p class="about-version">Version 1.0.0</p>
                        <p class="about-description">
                            A professional, feature-rich intranet homepage that streamlines daily workflows 
                            for employees by surfacing critical information and tools in one cohesive dashboard.
                        </p>
                        
                        <div class="about-features">
                            <h5>Key Features:</h5>
                            <ul>
                                <li>📢 Real-time announcements and alerts</li>
                                <li>🚀 Customizable quick launch shortcuts</li>
                                <li>📋 Task and approval management</li>
                                <li>📅 Integrated team calendar</li>
                                <li>🎫 Support ticket tracking</li>
                                <li>🎨 Full customization options</li>
                                <li>♿ WCAG 2.1 AA accessibility compliance</li>
                                <li>📱 Responsive design for all devices</li>
                            </ul>
                        </div>
                        
                        <div class="about-tech">
                            <h5>Built With:</h5>
                            <div class="tech-stack">
                                <span class="tech-badge">HTML5</span>
                                <span class="tech-badge">CSS3</span>
                                <span class="tech-badge">JavaScript ES6+</span>
                                <span class="tech-badge">Web APIs</span>
                            </div>
                        </div>
                        
                        <div class="about-footer">
                            <p>Built with ❤️ for better workplace productivity</p>
                            <p class="about-copyright">© 2025 Smart Day-Starter Dashboard</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');

        // Focus management
        const closeButton = modal.querySelector('.about-modal__close');
        closeButton.focus();

        // Close handlers
        const closeModal = () => {
            document.body.classList.remove('modal-open');
            document.body.removeChild(modal);
        };

        closeButton.addEventListener('click', closeModal);
        modal.querySelector('.about-modal__backdrop').addEventListener('click', closeModal);

        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Cleanup when page unloads
     */
    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const navbar = new NavbarManager();
    navbar.init();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        navbar.destroy();
    });
});

export { NavbarManager };
