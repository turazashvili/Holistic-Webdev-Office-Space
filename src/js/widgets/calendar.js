/**
 * Calendar Widget - Displays team calendar and upcoming events
 */

import { BaseWidget } from './baseWidget.js';

export class CalendarWidget extends BaseWidget {
    constructor(container, services) {
        super(container, services);
        this.events = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.refreshIntervalMs = 600000; // 10 minutes
    }

    async init() {
        try {
            console.log('📅 Initializing Calendar Widget...');
            
            await this.loadData();
            this.render();
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Calendar Widget initialized');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadData() {
        try {
            const response = await fetch('src/data/calendar.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.events = await response.json();
            
            // Sort events by start time
            this.events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            
        } catch (error) {
            console.error('Failed to load calendar events:', error);
            throw error;
        }
    }

    render() {
        const todayEvents = this.getTodayEvents();
        const upcomingEvents = this.getUpcomingEvents();

        this.container.innerHTML = `
            <div class="calendar__header">
                <div class="calendar__today-summary">
                    <h3 class="calendar__today-title">Today's Schedule</h3>
                    <div class="calendar__today-count">
                        ${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
            
            <div class="calendar__content">
                <div class="calendar__today-events">
                    ${todayEvents.length > 0 ? 
                        todayEvents.map(event => this.renderEvent(event, true)).join('') :
                        '<div class="calendar__no-events">No events scheduled for today</div>'
                    }
                </div>
                
                <div class="calendar__mini-calendar">
                    ${this.renderMiniCalendar()}
                </div>
                
                <div class="calendar__upcoming">
                    <h4 class="calendar__upcoming-title">Upcoming Events</h4>
                    <div class="calendar__upcoming-list">
                        ${upcomingEvents.slice(0, 3).map(event => this.renderEvent(event, false)).join('')}
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    renderEvent(event, isToday = false) {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const now = new Date();
        const isOngoing = now >= startTime && now <= endTime;
        const isPast = now > endTime;
        
        const statusClass = isOngoing ? 'event--ongoing' : isPast ? 'event--past' : 'event--upcoming';
        const priorityClass = `event--priority-${event.priority}`;
        const typeClass = `event--type-${event.type}`;

        const timeFormat = isToday ? 
            { hour: '2-digit', minute: '2-digit' } : 
            { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        return `
            <div class="calendar__event ${statusClass} ${priorityClass} ${typeClass}" 
                 data-event-id="${event.id}"
                 role="button"
                 tabindex="0"
                 aria-label="Event: ${this.sanitizeHTML(event.title)} at ${startTime.toLocaleString()}">
                
                <div class="event__content">
                    <div class="event__header">
                        <div class="event__icon" aria-hidden="true">${event.icon}</div>
                        <div class="event__title-section">
                            <h5 class="event__title">${this.sanitizeHTML(event.title)}</h5>
                            <div class="event__time">
                                ${startTime.toLocaleTimeString('en-US', timeFormat)} - 
                                ${endTime.toLocaleTimeString('en-US', timeFormat)}
                            </div>
                        </div>
                        <div class="event__status">
                            ${isOngoing ? '<span class="event__status-badge event__status-badge--live">LIVE</span>' : ''}
                            ${event.priority === 'high' ? '<span class="event__priority-indicator" aria-label="High priority">!</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="event__details">
                        ${event.location ? `<div class="event__location">📍 ${this.sanitizeHTML(event.location)}</div>` : ''}
                        ${event.attendees && event.attendees.length > 0 ? 
                            `<div class="event__attendees">👥 ${event.attendees.length} attendee${event.attendees.length !== 1 ? 's' : ''}</div>` : ''
                        }
                        ${event.meetingLink ? 
                            `<div class="event__meeting-link">
                                <a href="${event.meetingLink}" target="_blank" rel="noopener noreferrer">
                                    🔗 Join Meeting
                                </a>
                            </div>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderMiniCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        let calendarHTML = `
            <div class="mini-calendar__header">
                <button class="mini-calendar__nav mini-calendar__nav--prev" 
                        aria-label="Previous month"
                        data-action="prev-month">‹</button>
                <h4 class="mini-calendar__title">${monthName}</h4>
                <button class="mini-calendar__nav mini-calendar__nav--next" 
                        aria-label="Next month"
                        data-action="next-month">›</button>
            </div>
            <table class="mini-calendar__grid" role="grid" aria-label="Calendar">
                <thead>
                    <tr role="row">
                        <th role="columnheader" abbr="Sunday">S</th>
                        <th role="columnheader" abbr="Monday">M</th>
                        <th role="columnheader" abbr="Tuesday">T</th>
                        <th role="columnheader" abbr="Wednesday">W</th>
                        <th role="columnheader" abbr="Thursday">T</th>
                        <th role="columnheader" abbr="Friday">F</th>
                        <th role="columnheader" abbr="Saturday">S</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            calendarHTML += '<tr role="row">';
            
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const hasEvents = this.getEventsForDate(currentDate).length > 0;
                
                const cellClass = [
                    'mini-calendar__cell',
                    isCurrentMonth ? 'mini-calendar__cell--current-month' : 'mini-calendar__cell--other-month',
                    isToday ? 'mini-calendar__cell--today' : '',
                    hasEvents ? 'mini-calendar__cell--has-events' : ''
                ].filter(Boolean).join(' ');

                calendarHTML += `
                    <td class="${cellClass}" 
                        role="gridcell"
                        data-date="${currentDate.toISOString().split('T')[0]}"
                        tabindex="${isToday ? '0' : '-1'}"
                        aria-label="${currentDate.toLocaleDateString()} ${hasEvents ? 'has events' : ''}">
                        <span class="mini-calendar__date">${currentDate.getDate()}</span>
                        ${hasEvents ? '<span class="mini-calendar__event-indicator" aria-hidden="true">•</span>' : ''}
                    </td>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            calendarHTML += '</tr>';
            
            // Stop if we've filled the month and are in the next month
            if (currentDate.getMonth() !== month && week >= 4) break;
        }

        calendarHTML += '</tbody></table>';
        return calendarHTML;
    }

    addEventListeners() {
        // Event click handlers
        const events = this.container.querySelectorAll('.calendar__event');
        events.forEach(event => {
            event.addEventListener('click', () => {
                const eventId = event.getAttribute('data-event-id');
                this.showEventDetails(eventId);
            });
            
            event.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const eventId = event.getAttribute('data-event-id');
                    this.showEventDetails(eventId);
                }
            });
        });

        // Mini calendar navigation
        const prevButton = this.container.querySelector('[data-action="prev-month"]');
        const nextButton = this.container.querySelector('[data-action="next-month"]');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            });
        }

        // Calendar cell clicks
        const cells = this.container.querySelectorAll('.mini-calendar__cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const dateStr = cell.getAttribute('data-date');
                if (dateStr) {
                    this.selectedDate = new Date(dateStr);
                    this.showDayEvents(this.selectedDate);
                }
            });
        });

        // Keyboard navigation for calendar
        this.setupCalendarKeyboardNavigation();
    }

    setupCalendarKeyboardNavigation() {
        const cells = this.container.querySelectorAll('.mini-calendar__cell');
        
        cells.forEach(cell => {
            cell.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(cells).indexOf(cell);
                let newIndex = currentIndex;
                
                switch (e.key) {
                    case 'ArrowLeft':
                        newIndex = Math.max(0, currentIndex - 1);
                        break;
                    case 'ArrowRight':
                        newIndex = Math.min(cells.length - 1, currentIndex + 1);
                        break;
                    case 'ArrowUp':
                        newIndex = Math.max(0, currentIndex - 7);
                        break;
                    case 'ArrowDown':
                        newIndex = Math.min(cells.length - 1, currentIndex + 7);
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        cell.click();
                        return;
                    default:
                        return;
                }
                
                e.preventDefault();
                cells[newIndex].focus();
            });
        });
    }

    getTodayEvents() {
        const today = new Date();
        return this.events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === today.toDateString();
        });
    }

    getUpcomingEvents() {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate > now && eventDate <= nextWeek;
        });
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-modal__backdrop"></div>
            <div class="event-modal__content" role="dialog" aria-labelledby="event-modal-title" aria-modal="true">
                <div class="event-modal__header">
                    <h3 id="event-modal-title">${this.sanitizeHTML(event.title)}</h3>
                    <button class="event-modal__close" aria-label="Close event details">×</button>
                </div>
                <div class="event-modal__body">
                    <div class="event-detail">
                        <strong>📅 Time:</strong> 
                        ${this.formatDate(event.startTime)} - ${this.formatDate(event.endTime)}
                    </div>
                    ${event.location ? `
                        <div class="event-detail">
                            <strong>📍 Location:</strong> ${this.sanitizeHTML(event.location)}
                        </div>
                    ` : ''}
                    ${event.description ? `
                        <div class="event-detail">
                            <strong>📝 Description:</strong> ${this.sanitizeHTML(event.description)}
                        </div>
                    ` : ''}
                    ${event.attendees && event.attendees.length > 0 ? `
                        <div class="event-detail">
                            <strong>👥 Attendees:</strong> ${event.attendees.map(a => this.sanitizeHTML(a)).join(', ')}
                        </div>
                    ` : ''}
                    ${event.organizer ? `
                        <div class="event-detail">
                            <strong>👤 Organizer:</strong> ${this.sanitizeHTML(event.organizer)}
                        </div>
                    ` : ''}
                    ${event.meetingLink ? `
                        <div class="event-detail">
                            <strong>🔗 Meeting Link:</strong> 
                            <a href="${event.meetingLink}" target="_blank" rel="noopener noreferrer">
                                Join Meeting
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        // Focus management
        const closeButton = modal.querySelector('.event-modal__close');
        closeButton.focus();
        this.services.accessibility.trapFocus(modal.querySelector('.event-modal__content'));

        // Close handlers
        const closeModal = () => {
            this.services.accessibility.releaseFocusTrap();
            document.body.classList.remove('modal-open');
            document.body.removeChild(modal);
        };

        closeButton.addEventListener('click', closeModal);
        modal.querySelector('.event-modal__backdrop').addEventListener('click', closeModal);
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    showDayEvents(date) {
        const events = this.getEventsForDate(date);
        const dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        this.announce(`${events.length} event${events.length !== 1 ? 's' : ''} on ${dateStr}`);
        
        // Could show a detailed day view or highlight the events
        console.log(`Events for ${dateStr}:`, events);
    }

    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        const todayEvents = this.getTodayEvents();
        const upcomingEvents = this.getUpcomingEvents();
        
        return {
            ...baseInfo,
            totalEvents: this.events.length,
            todayEvents: todayEvents.length,
            upcomingEvents: upcomingEvents.length,
            currentMonth: this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    }
}
