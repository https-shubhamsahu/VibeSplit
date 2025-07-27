import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.pageViews = [];
    this.isTrackingEnabled = true;
    
    // Initialize session tracking
    this.initializeSession();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  initializeSession() {
    try {
      // Track session start
      this.trackEvent('session_start', {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || 'direct',
        url: window.location.href
      });

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('page_hidden');
        } else {
          this.trackEvent('page_visible');
        }
      });

      // Track session end on page unload
      window.addEventListener('beforeunload', () => {
        this.trackSessionEnd();
      });

      // Track page views on route changes
      this.trackPageView();
      
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  async trackEvent(eventName, eventData = {}) {
    if (!this.isTrackingEnabled) return;

    try {
      const event = {
        eventName,
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        url: window.location.href,
        pathname: window.location.pathname,
        hash: window.location.hash,
        ...eventData
      };

      // Store in Firebase
      await addDoc(collection(db, 'analytics_events'), event);

      // Also store locally as backup
      this.storeEventLocally(event);

    } catch (error) {
      console.warn('Failed to track event:', error);
      // Fallback to local storage only
      this.storeEventLocally({
        eventName,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...eventData
      });
    }
  }

  storeEventLocally(event) {
    try {
      const events = JSON.parse(localStorage.getItem('vibesplit_analytics') || '[]');
      events.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem('vibesplit_analytics', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store event locally:', error);
    }
  }

  trackPageView(pageName = null) {
    const pageData = {
      page: pageName || this.getCurrentPageName(),
      title: document.title,
      loadTime: Date.now() - this.sessionStartTime
    };

    this.pageViews.push(pageData);
    this.trackEvent('page_view', pageData);
  }

  trackUserAction(action, details = {}) {
    this.trackEvent('user_action', {
      action,
      ...details
    });
  }

  trackTripAction(action, tripType, tripId = null) {
    this.trackEvent('trip_action', {
      action,
      tripType,
      tripId
    });
  }

  trackError(error, context = {}) {
    this.trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      context
    });
  }

  trackPerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.trackEvent('performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          networkTime: navigation.responseEnd - navigation.requestStart,
          renderTime: navigation.loadEventEnd - navigation.responseEnd
        });
      }
    }
  }

  getCurrentPageName() {
    const path = window.location.pathname + window.location.hash;
    
    // Map routes to readable page names
    const pageMap = {
      '/': 'Home',
      '/#/': 'Home',
      '/#/dashboard': 'Dashboard',
      '/#/about': 'About',
      '/#/trip/new': 'New Trip',
      '/#/canteen/new': 'New Canteen',
      '/#/outing/new': 'New Outing',
      '/#/project/new': 'New Project'
    };

    // Check for dynamic routes
    if (path.includes('/trip/')) return 'Trip View';
    if (path.includes('/canteen/')) return 'Canteen View';
    if (path.includes('/outing/')) return 'Outing View';
    if (path.includes('/project/')) return 'Project View';
    if (path.includes('/join/')) return 'Join Trip';

    return pageMap[path] || 'Unknown Page';
  }

  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.trackEvent('session_end', {
      sessionDuration,
      pageViews: this.pageViews.length,
      pages: this.pageViews.map(pv => pv.page)
    });
  }

  async getAnalytics(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'analytics_events'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return this.processAnalyticsData(events);
    } catch (error) {
      console.warn('Failed to fetch analytics:', error);
      return this.getLocalAnalytics();
    }
  }

  getLocalAnalytics() {
    try {
      const events = JSON.parse(localStorage.getItem('vibesplit_analytics') || '[]');
      return this.processAnalyticsData(events);
    } catch (error) {
      console.warn('Failed to process local analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  processAnalyticsData(events) {
    const analytics = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map(e => e.sessionId)).size,
      pageViews: events.filter(e => e.eventName === 'page_view').length,
      userActionCount: events.filter(e => e.eventName === 'user_action').length,
      errors: events.filter(e => e.eventName === 'error').length,
      popularPages: {},
      topUserActions: {},
      dailyStats: {}
    };

    events.forEach(event => {
      // Count popular pages
      if (event.eventName === 'page_view' && event.page) {
        analytics.popularPages[event.page] = (analytics.popularPages[event.page] || 0) + 1;
      }

      // Count user actions
      if (event.eventName === 'user_action' && event.action) {
        analytics.topUserActions[event.action] = (analytics.topUserActions[event.action] || 0) + 1;
      }

      // Daily stats
      const date = new Date(event.timestamp?.toDate?.() || event.timestamp).toDateString();
      if (!analytics.dailyStats[date]) {
        analytics.dailyStats[date] = { events: 0, sessions: new Set() };
      }
      analytics.dailyStats[date].events++;
      analytics.dailyStats[date].sessions.add(event.sessionId);
    });

    // Convert sets to counts
    Object.keys(analytics.dailyStats).forEach(date => {
      analytics.dailyStats[date].uniqueSessions = analytics.dailyStats[date].sessions.size;
      delete analytics.dailyStats[date].sessions;
    });

    return analytics;
  }

  getEmptyAnalytics() {
    return {
      totalEvents: 0,
      uniqueSessions: 0,
      pageViews: 0,
      userActionCount: 0,
      errors: 0,
      popularPages: {},
      topUserActions: {},
      dailyStats: {}
    };
  }

  setTrackingEnabled(enabled) {
    this.isTrackingEnabled = enabled;
    localStorage.setItem('vibesplit_tracking_enabled', enabled.toString());
  }

  isTrackingAllowed() {
    const stored = localStorage.getItem('vibesplit_tracking_enabled');
    return stored !== 'false'; // Default to true unless explicitly disabled
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Track performance after page load
if (document.readyState === 'complete') {
  analyticsService.trackPerformance();
} else {
  window.addEventListener('load', () => {
    analyticsService.trackPerformance();
  });
}

export default analyticsService;
