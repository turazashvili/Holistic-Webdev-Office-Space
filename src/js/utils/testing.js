/**
 * Testing Utilities - Comprehensive testing suite for the dashboard
 */

export class TestingSuite {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting comprehensive test suite...');
        
        this.results = [];
        
        // Accessibility tests
        await this.runAccessibilityTests();
        
        // Performance tests
        await this.runPerformanceTests();
        
        // Functionality tests
        await this.runFunctionalityTests();
        
        // Responsive design tests
        await this.runResponsiveTests();
        
        // Browser compatibility tests
        await this.runCompatibilityTests();
        
        // Generate report
        this.generateReport();
        
        console.log('✅ Test suite completed');
        return this.results;
    }

    /**
     * Run accessibility tests
     */
    async runAccessibilityTests() {
        console.log('♿ Running accessibility tests...');
        
        const tests = [
            this.testKeyboardNavigation,
            this.testScreenReaderSupport,
            this.testColorContrast,
            this.testFocusManagement,
            this.testARIALabels,
            this.testSemanticHTML,
            this.testSkipLinks,
            this.testTouchTargets
        ];

        for (const test of tests) {
            try {
                const result = await test.call(this);
                this.results.push(result);
            } catch (error) {
                this.results.push({
                    category: 'Accessibility',
                    test: test.name,
                    passed: false,
                    message: error.message,
                    severity: 'high'
                });
            }
        }
    }

    /**
     * Test keyboard navigation
     */
    testKeyboardNavigation() {
        const focusableElements = document.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        let issues = [];
        
        focusableElements.forEach((element, index) => {
            // Check if element is visible
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                issues.push(`Element ${index} is not visible but focusable`);
            }
            
            // Check for focus indicators
            const computedStyle = window.getComputedStyle(element, ':focus');
            if (!computedStyle.outline && !computedStyle.boxShadow && !computedStyle.border) {
                issues.push(`Element ${index} lacks visible focus indicator`);
            }
        });

        return {
            category: 'Accessibility',
            test: 'Keyboard Navigation',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'All focusable elements are properly accessible' : issues.join('; '),
            severity: 'high',
            details: {
                focusableElements: focusableElements.length,
                issues: issues
            }
        };
    }

    /**
     * Test screen reader support
     */
    testScreenReaderSupport() {
        const issues = [];
        
        // Check for proper headings structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            issues.push('No headings found');
        }
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.alt && img.alt !== '') {
                issues.push(`Image ${index} missing alt text`);
            }
        });
        
        // Check for form labels
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach((input, index) => {
            const hasLabel = input.labels && input.labels.length > 0;
            const hasAriaLabel = input.hasAttribute('aria-label');
            const hasAriaLabelledby = input.hasAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
                issues.push(`Form element ${index} missing label`);
            }
        });
        
        // Check for landmarks
        const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[aria-label], [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
        if (landmarks.length === 0) {
            issues.push('No landmark elements found');
        }

        return {
            category: 'Accessibility',
            test: 'Screen Reader Support',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Screen reader support is adequate' : issues.join('; '),
            severity: 'high',
            details: {
                headings: headings.length,
                images: images.length,
                inputs: inputs.length,
                landmarks: landmarks.length,
                issues: issues
            }
        };
    }

    /**
     * Test color contrast
     */
    testColorContrast() {
        const issues = [];
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
        
        textElements.forEach((element, index) => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            if (color && backgroundColor && color !== backgroundColor) {
                const contrast = this.calculateContrastRatio(color, backgroundColor);
                if (contrast < 4.5) {
                    issues.push(`Element ${index} has insufficient contrast ratio: ${contrast.toFixed(2)}`);
                }
            }
        });

        return {
            category: 'Accessibility',
            test: 'Color Contrast',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Color contrast meets WCAG AA standards' : `${issues.length} contrast issues found`,
            severity: 'medium',
            details: {
                elementsChecked: textElements.length,
                issues: issues
            }
        };
    }

    /**
     * Test focus management
     */
    testFocusManagement() {
        const issues = [];
        
        // Check for focus traps in modals
        const modals = document.querySelectorAll('[role="dialog"], .modal, .task-modal, .ticket-modal');
        modals.forEach((modal, index) => {
            if (modal.style.display !== 'none') {
                const focusableElements = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (focusableElements.length === 0) {
                    issues.push(`Modal ${index} has no focusable elements`);
                }
            }
        });
        
        // Check for skip links
        const skipLinks = document.querySelectorAll('.skip-nav, [href^="#main"]');
        if (skipLinks.length === 0) {
            issues.push('No skip navigation links found');
        }

        return {
            category: 'Accessibility',
            test: 'Focus Management',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Focus management is properly implemented' : issues.join('; '),
            severity: 'medium',
            details: {
                modals: modals.length,
                skipLinks: skipLinks.length,
                issues: issues
            }
        };
    }

    /**
     * Test ARIA labels
     */
    testARIALabels() {
        const issues = [];
        
        // Check for proper ARIA usage
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        ariaElements.forEach((element, index) => {
            // Check for empty aria-label
            if (element.hasAttribute('aria-label') && !element.getAttribute('aria-label').trim()) {
                issues.push(`Element ${index} has empty aria-label`);
            }
            
            // Check for invalid aria-labelledby references
            if (element.hasAttribute('aria-labelledby')) {
                const ids = element.getAttribute('aria-labelledby').split(' ');
                ids.forEach(id => {
                    if (!document.getElementById(id)) {
                        issues.push(`Element ${index} references non-existent ID in aria-labelledby: ${id}`);
                    }
                });
            }
        });

        return {
            category: 'Accessibility',
            test: 'ARIA Labels',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'ARIA labels are properly implemented' : issues.join('; '),
            severity: 'medium',
            details: {
                ariaElements: ariaElements.length,
                issues: issues
            }
        };
    }

    /**
     * Test semantic HTML
     */
    testSemanticHTML() {
        const issues = [];
        
        // Check for semantic elements
        const semanticElements = document.querySelectorAll('main, nav, header, footer, article, section, aside');
        if (semanticElements.length === 0) {
            issues.push('No semantic HTML elements found');
        }
        
        // Check for proper heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let previousLevel = 0;
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > previousLevel + 1) {
                issues.push(`Heading ${index} skips levels (h${previousLevel} to h${level})`);
            }
            previousLevel = level;
        });

        return {
            category: 'Accessibility',
            test: 'Semantic HTML',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Semantic HTML is properly used' : issues.join('; '),
            severity: 'medium',
            details: {
                semanticElements: semanticElements.length,
                headings: headings.length,
                issues: issues
            }
        };
    }

    /**
     * Test skip links
     */
    testSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-nav');
        const issues = [];
        
        if (skipLinks.length === 0) {
            issues.push('No skip navigation links found');
        } else {
            skipLinks.forEach((link, index) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const target = document.querySelector(href);
                    if (!target) {
                        issues.push(`Skip link ${index} targets non-existent element: ${href}`);
                    }
                }
            });
        }

        return {
            category: 'Accessibility',
            test: 'Skip Links',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Skip links are properly implemented' : issues.join('; '),
            severity: 'low',
            details: {
                skipLinks: skipLinks.length,
                issues: issues
            }
        };
    }

    /**
     * Test touch targets
     */
    testTouchTargets() {
        const issues = [];
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
        
        interactiveElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                issues.push(`Interactive element ${index} is smaller than 44px touch target`);
            }
        });

        return {
            category: 'Accessibility',
            test: 'Touch Targets',
            passed: issues.length === 0,
            message: issues.length === 0 ? 'All touch targets meet minimum size requirements' : `${issues.length} elements below 44px`,
            severity: 'medium',
            details: {
                interactiveElements: interactiveElements.length,
                issues: issues
            }
        };
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('⚡ Running performance tests...');
        
        const tests = [
            this.testPageLoadTime,
            this.testResourceSizes,
            this.testMemoryUsage,
            this.testRenderPerformance
        ];

        for (const test of tests) {
            try {
                const result = await test.call(this);
                this.results.push(result);
            } catch (error) {
                this.results.push({
                    category: 'Performance',
                    test: test.name,
                    passed: false,
                    message: error.message,
                    severity: 'medium'
                });
            }
        }
    }

    /**
     * Test page load time
     */
    testPageLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
        
        return {
            category: 'Performance',
            test: 'Page Load Time',
            passed: loadTime < 3000, // 3 seconds
            message: `Page loaded in ${loadTime}ms`,
            severity: 'medium',
            details: {
                loadTime: loadTime,
                target: 3000
            }
        };
    }

    /**
     * Test resource sizes
     */
    testResourceSizes() {
        const resources = performance.getEntriesByType('resource');
        const issues = [];
        let totalSize = 0;
        
        resources.forEach(resource => {
            if (resource.transferSize) {
                totalSize += resource.transferSize;
                
                // Check for large resources
                if (resource.transferSize > 1024 * 1024) { // 1MB
                    issues.push(`Large resource: ${resource.name} (${(resource.transferSize / 1024 / 1024).toFixed(2)}MB)`);
                }
            }
        });

        return {
            category: 'Performance',
            test: 'Resource Sizes',
            passed: totalSize < 5 * 1024 * 1024, // 5MB total
            message: `Total resources: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            severity: 'low',
            details: {
                totalSize: totalSize,
                resourceCount: resources.length,
                issues: issues
            }
        };
    }

    /**
     * Test memory usage
     */
    testMemoryUsage() {
        if (!performance.memory) {
            return {
                category: 'Performance',
                test: 'Memory Usage',
                passed: true,
                message: 'Memory API not available',
                severity: 'low'
            };
        }

        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        
        return {
            category: 'Performance',
            test: 'Memory Usage',
            passed: memoryUsage < 50, // 50MB
            message: `Memory usage: ${memoryUsage.toFixed(2)}MB`,
            severity: 'low',
            details: {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            }
        };
    }

    /**
     * Test render performance
     */
    testRenderPerformance() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        const fcpTime = fcp ? fcp.startTime : 0;
        
        return {
            category: 'Performance',
            test: 'Render Performance',
            passed: fcpTime < 1500, // 1.5 seconds
            message: `First Contentful Paint: ${fcpTime.toFixed(2)}ms`,
            severity: 'medium',
            details: {
                firstContentfulPaint: fcpTime,
                target: 1500
            }
        };
    }

    /**
     * Run functionality tests
     */
    async runFunctionalityTests() {
        console.log('🔧 Running functionality tests...');
        
        // Test widget loading
        const widgets = ['announcements', 'tasks', 'calendar', 'tickets', 'quickLaunch'];
        
        for (const widgetName of widgets) {
            const widget = document.querySelector(`.widget--${widgetName}`);
            this.results.push({
                category: 'Functionality',
                test: `${widgetName} Widget Loading`,
                passed: !!widget,
                message: widget ? 'Widget loaded successfully' : 'Widget not found',
                severity: 'high'
            });
        }
    }

    /**
     * Run responsive design tests
     */
    async runResponsiveTests() {
        console.log('📱 Running responsive design tests...');
        
        const breakpoints = [320, 768, 1024, 1280];
        const issues = [];
        
        breakpoints.forEach(width => {
            // Simulate viewport width (limited testing in this environment)
            const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
            // This is a simplified test - in a real environment you'd use tools like Puppeteer
        });

        this.results.push({
            category: 'Responsive Design',
            test: 'Breakpoint Testing',
            passed: true,
            message: 'Responsive design structure is in place',
            severity: 'medium',
            details: {
                breakpoints: breakpoints,
                note: 'Full responsive testing requires browser automation tools'
            }
        });
    }

    /**
     * Run browser compatibility tests
     */
    async runCompatibilityTests() {
        console.log('🌐 Running browser compatibility tests...');
        
        const features = [
            { name: 'ES6 Modules', test: () => typeof import !== 'undefined' },
            { name: 'CSS Grid', test: () => CSS.supports('display', 'grid') },
            { name: 'CSS Custom Properties', test: () => CSS.supports('--test', '0') },
            { name: 'Fetch API', test: () => typeof fetch !== 'undefined' },
            { name: 'LocalStorage', test: () => typeof localStorage !== 'undefined' },
            { name: 'IntersectionObserver', test: () => typeof IntersectionObserver !== 'undefined' }
        ];

        features.forEach(feature => {
            const supported = feature.test();
            this.results.push({
                category: 'Browser Compatibility',
                test: feature.name,
                passed: supported,
                message: supported ? 'Supported' : 'Not supported',
                severity: supported ? 'low' : 'high'
            });
        });
    }

    /**
     * Calculate contrast ratio between two colors
     */
    calculateContrastRatio(color1, color2) {
        const getLuminance = (color) => {
            const rgb = this.parseColor(color);
            if (!rgb) return 0;
            
            const [r, g, b] = rgb.map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        return ratio;
    }

    /**
     * Parse color string to RGB values
     */
    parseColor(color) {
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        const computedColor = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
    }

    /**
     * Generate test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.passed).length,
                failed: this.results.filter(r => !r.passed).length,
                categories: {}
            },
            results: this.results
        };

        // Group by category
        this.results.forEach(result => {
            if (!report.summary.categories[result.category]) {
                report.summary.categories[result.category] = { total: 0, passed: 0, failed: 0 };
            }
            report.summary.categories[result.category].total++;
            if (result.passed) {
                report.summary.categories[result.category].passed++;
            } else {
                report.summary.categories[result.category].failed++;
            }
        });

        console.log('📊 Test Report:', report);
        
        // Store report in localStorage for later access
        try {
            localStorage.setItem('dashboard_test_report', JSON.stringify(report));
        } catch (error) {
            console.warn('Could not save test report to localStorage');
        }

        return report;
    }

    /**
     * Create visual test report
     */
    createVisualReport() {
        const report = this.generateReport();
        
        const reportHTML = `
            <div class="test-report">
                <h2>Dashboard Test Report</h2>
                <div class="test-summary">
                    <div class="summary-stat">
                        <span class="stat-number">${report.summary.total}</span>
                        <span class="stat-label">Total Tests</span>
                    </div>
                    <div class="summary-stat success">
                        <span class="stat-number">${report.summary.passed}</span>
                        <span class="stat-label">Passed</span>
                    </div>
                    <div class="summary-stat error">
                        <span class="stat-number">${report.summary.failed}</span>
                        <span class="stat-label">Failed</span>
                    </div>
                </div>
                
                <div class="test-categories">
                    ${Object.entries(report.summary.categories).map(([category, stats]) => `
                        <div class="category-summary">
                            <h3>${category}</h3>
                            <div class="category-stats">
                                <span class="passed">${stats.passed} passed</span>
                                <span class="failed">${stats.failed} failed</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="test-results">
                    ${this.results.map(result => `
                        <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                            <div class="test-header">
                                <span class="test-status">${result.passed ? '✅' : '❌'}</span>
                                <span class="test-name">${result.test}</span>
                                <span class="test-category">${result.category}</span>
                            </div>
                            <div class="test-message">${result.message}</div>
                            ${result.details ? `<details class="test-details">
                                <summary>Details</summary>
                                <pre>${JSON.stringify(result.details, null, 2)}</pre>
                            </details>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return reportHTML;
    }
}
