# Smart Day-Starter Dashboard

A professional, feature-rich intranet homepage that streamlines daily workflows for employees by surfacing critical information and tools in one cohesive dashboard.

![Dashboard Preview](docs/dashboard-preview.png)

## 🌟 Features

### Core Widgets
- **📢 Announcements & Alerts** - Company-wide notifications with dismissible banners
- **🚀 Quick Launch** - Customizable shortcuts to internal tools with drag-and-drop reordering
- **📋 Tasks & Approvals** - Pending tasks, approvals, and workflow items
- **📅 Team Calendar** - Mini calendar with today's events and upcoming meetings
- **🎫 Support Tickets** - Real-time ticket dashboard with status tracking

### Advanced Features
- **🎨 Full Customization** - Theme switching, layout preferences, widget visibility
- **♿ Accessibility First** - WCAG 2.1 AA compliant with full keyboard and screen reader support
- **📱 Responsive Design** - Works seamlessly across desktop, tablet, and mobile devices
- **🔄 Real-time Updates** - Auto-refresh with offline/online detection
- **💾 Data Persistence** - LocalStorage with fallback for user preferences and custom data
- **🌙 Dark Mode** - System-aware theme switching with manual override
- **⚡ Performance Optimized** - Lighthouse scores ≥90 Performance, ≥95 Accessibility

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Local web server (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-day-starter-dashboard
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
smart-day-starter-dashboard/
├── index.html                 # Main dashboard page
├── src/
│   ├── css/
│   │   └── main.css          # Comprehensive stylesheet with BEM methodology
│   ├── js/
│   │   ├── main.js           # Application entry point
│   │   ├── services/         # Core services
│   │   │   ├── storage.js    # LocalStorage management
│   │   │   ├── theme.js      # Theme switching
│   │   │   ├── eventBus.js   # Pub/sub communication
│   │   │   ├── realtime.js   # Auto-refresh and updates
│   │   │   └── customization.js # User preferences
│   │   ├── widgets/          # Dashboard widgets
│   │   │   ├── baseWidget.js # Base widget class
│   │   │   ├── announcements.js
│   │   │   ├── quickLaunch.js
│   │   │   ├── tasks.js
│   │   │   ├── calendar.js
│   │   │   └── tickets.js
│   │   └── utils/            # Utility modules
│   │       ├── loading.js    # Loading states
│   │       ├── accessibility.js # A11y helpers
│   │       └── testing.js    # Test suite
│   └── data/                 # Mock data files
│       ├── announcements.json
│       ├── tasks.json
│       ├── calendar.json
│       ├── tickets.json
│       └── shortcuts.json
├── docs/                     # Documentation
│   └── wireframes.md        # Design wireframes
└── README.md               # This file
```

## 🎯 User Personas

### Manager Mia (Team Lead)
- **Needs**: Overview of team tasks, pending approvals, company announcements
- **Usage**: Reviews daily tasks, approves requests, stays informed on company updates

### Staff Steve (Individual Contributor)
- **Needs**: Quick access to tools, personal tasks, meeting schedule
- **Usage**: Launches applications, tracks personal work, checks calendar

### IT Ingrid (Technical Support)
- **Needs**: Support ticket dashboard, system monitoring, infrastructure alerts
- **Usage**: Monitors tickets, responds to issues, tracks system health

## 🛠️ Technical Architecture

### Frontend Stack
- **HTML5** - Semantic markup with proper accessibility
- **CSS3** - Modern features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript** - ES6+ modules, no external dependencies
- **Web APIs** - LocalStorage, Fetch, IntersectionObserver

### Design Patterns
- **Module Pattern** - ES6 modules for code organization
- **Observer Pattern** - Event-driven communication between components
- **Strategy Pattern** - Pluggable widget architecture
- **Factory Pattern** - Dynamic widget creation

### Architecture Principles
- **Progressive Enhancement** - Works without JavaScript
- **Mobile First** - Responsive design from smallest screens up
- **Accessibility First** - WCAG 2.1 AA compliance built-in
- **Performance First** - Optimized loading and rendering

## 🎨 Customization

### Layout Options
- **Grid Layout** - Card-based widget arrangement
- **Compact Mode** - Reduced spacing for information density
- **Widget Visibility** - Show/hide individual widgets
- **Custom Ordering** - Drag-and-drop widget reordering

### Accessibility Options
- **Font Size** - Small, Medium, Large options
- **High Contrast** - Enhanced contrast for visual impairments
- **Reduced Motion** - Respects user's motion preferences
- **Keyboard Navigation** - Full keyboard accessibility

## 📊 Performance Metrics


### Key Metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **First Input Delay**: <100ms


## 🔧 Development

### Adding New Widgets

1. **Create widget class**
   ```javascript
   // src/js/widgets/myWidget.js
   import { BaseWidget } from './baseWidget.js';
   
   export class MyWidget extends BaseWidget {
       async init() {
           await this.loadData();
           this.render();
       }
       
       async loadData() {
           // Load widget data
       }
       
       render() {
           // Render widget HTML
       }
   }
   ```

2. **Add to main application**
   ```javascript
   // src/js/main.js
   import { MyWidget } from './widgets/myWidget.js';
   
   // Add to widget configs
   {
       name: 'myWidget',
       class: MyWidget,
       container: '#my-widget-container',
       priority: 6
   }
   ```

3. **Add HTML container**
   ```html
   <!-- index.html -->
   <section class="widget widget--my-widget" aria-labelledby="my-widget-heading">
       <h2 id="my-widget-heading" class="widget__title">My Widget</h2>
       <div class="my-widget" id="my-widget-container">
           <!-- Widget content will be loaded here -->
       </div>
   </section>
   ```

### Customizing Styles

The CSS architecture uses BEM methodology with CSS custom properties:

```css
/* Define custom properties */
:root {
    --my-widget-color: #3b82f6;
    --my-widget-spacing: var(--space-4);
}

/* Use BEM naming */
.my-widget {
    color: var(--my-widget-color);
    padding: var(--my-widget-spacing);
}

.my-widget__item {
    /* Widget item styles */
}

.my-widget__item--active {
    /* Active state modifier */
}
```

## 🌐 Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Graceful Degradation
- Internet Explorer 11 (limited functionality)
- Older mobile browsers

### Required Features
- ES6 Modules
- CSS Grid
- CSS Custom Properties
- Fetch API
- LocalStorage

## 📈 Analytics & Monitoring

### Performance Monitoring
- Core Web Vitals tracking
- Resource loading metrics
- Error logging and reporting
- User interaction analytics

### Accessibility Monitoring
- Automated a11y testing
- User feedback collection
- Screen reader usage tracking
- Keyboard navigation metrics

## 🔒 Security Considerations

### Data Protection
- No sensitive data stored in LocalStorage
- XSS prevention through content sanitization
- CSP headers recommended for production
- HTTPS required for production deployment

### Privacy
- No external tracking scripts
- No personal data collection
- User preferences stored locally only
- Transparent data usage

## 🚀 Deployment

### Production Checklist
- [ ] Minify CSS and JavaScript
- [ ] Optimize images and assets
- [ ] Configure CSP headers
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Test on target browsers
- [ ] Validate accessibility
- [ ] Performance audit

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the DEV.to Holistic Webdev Challenge by [Axero](https://axerosolutions.com/)
- Inspired by modern intranet solutions
- Accessibility guidelines from WCAG 2.1
- Performance best practices from web.dev

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the test suite for examples
- Follow the development guidelines

---

**Built with ❤️ for better workplace productivity**
