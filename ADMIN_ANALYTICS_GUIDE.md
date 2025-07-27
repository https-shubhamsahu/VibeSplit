# 📊 VibeSplit Admin Analytics Guide

## Overview
VibeSplit now includes comprehensive analytics tracking for all user activities. As an admin, you can access this data through multiple channels.

## 🔥 Firebase Console Access

### 1. **Analytics Events Collection**
- **Location**: Firebase Console → Firestore Database → `analytics_events` collection
- **Contains**: All user interactions, page views, trip actions, errors
- **Data Structure**:
  ```json
  {
    "eventName": "trip_action",
    "sessionId": "session_1234567890_abc123",
    "timestamp": "2025-01-27T19:41:31.000Z",
    "url": "https://yourapp.com/#/trip/123",
    "pathname": "/VibeSplit/",
    "hash": "#/trip/123",
    "action": "create_trip",
    "tripType": "canteen",
    "tripId": "abc123"
  }
  ```

### 2. **Trip History Collection**
- **Location**: Firebase Console → Firestore Database → `trip_history` collection
- **Contains**: All created trips with metadata
- **Data Structure**:
  ```json
  {
    "tripId": "abc123",
    "tripName": "Lunch Group",
    "category": "canteen",
    "createdAt": "2025-01-27T19:41:31.000Z",
    "userId": "user123",
    "memberCount": 3,
    "isGuest": false
  }
  ```

### 3. **Trip Activities Collection**
- **Location**: Firebase Console → Firestore Database → `trip_activities` collection
- **Contains**: Detailed trip activities (expenses added, members joined, etc.)

## 📈 Analytics Data Types

### **User Behavior Analytics**
- **Page Views**: Track which pages users visit most
- **Session Data**: User session duration and patterns
- **User Actions**: Button clicks, form submissions, feature usage
- **Error Tracking**: JavaScript errors and user-reported issues

### **Trip Analytics**
- **Trip Creation**: By category (trip, canteen, outing, project)
- **User Engagement**: Which features are used most
- **Sharing Patterns**: How often trips are shared
- **Guest vs Authenticated**: Usage patterns comparison

### **Performance Analytics**
- **Load Times**: Page load performance metrics
- **Error Rates**: Application stability metrics
- **User Flow**: How users navigate through the app

## 🔍 How to Access Data

### **Method 1: Firebase Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your VibeSplit project (`vibesplit-0011`)
3. Navigate to **Firestore Database**
4. Browse the collections:
   - `analytics_events` - All user interactions
   - `trip_history` - Trip creation history
   - `trip_activities` - Detailed trip activities

### **Method 2: Firebase Admin SDK (For Advanced Analytics)**
```javascript
// Example: Get analytics data programmatically
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all analytics events from last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const analyticsQuery = await db.collection('analytics_events')
  .where('timestamp', '>=', sevenDaysAgo)
  .orderBy('timestamp', 'desc')
  .get();

const events = analyticsQuery.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### **Method 3: Export Data**
1. In Firebase Console → Firestore Database
2. Click on a collection (e.g., `analytics_events`)
3. Use the export feature to download data as JSON
4. Analyze in Excel, Google Sheets, or analytics tools

## 📊 Key Metrics to Monitor

### **User Engagement**
- Daily/Monthly Active Users
- Session Duration
- Pages per Session
- Feature Usage Rates

### **Trip Analytics**
- Trips Created by Category
- Average Trip Size (members)
- Guest vs Authenticated Usage
- Share Link Success Rate

### **Technical Health**
- Error Rates by Page
- Load Time Performance
- Browser/Device Usage
- Geographic Distribution

## 🛠️ Advanced Analytics Setup

### **Google Analytics Integration (Optional)**
To get more detailed insights, you can integrate Google Analytics:

1. Add Google Analytics to your Firebase project
2. The existing analytics service can be extended to send data to GA
3. Get demographic data, real-time users, and advanced reports

### **Custom Dashboards**
Create custom dashboards using:
- **Google Data Studio**: Connect to Firebase and create visual reports
- **Tableau**: For advanced business intelligence
- **Custom React Dashboard**: Build an admin panel within VibeSplit

## 🔐 Data Privacy & Security

### **User Privacy**
- No personally identifiable information is stored in analytics
- User IDs are Firebase-generated, not personal data
- IP addresses are not logged
- Users can opt-out of tracking

### **Data Retention**
- Analytics events: Kept for 1 year
- Trip history: Kept permanently (business data)
- Local storage: User-controlled

### **GDPR Compliance**
- Users can request data deletion
- Clear privacy policy about data collection
- Opt-out mechanisms available

## 📞 Support & Questions

For questions about analytics data or custom reports:
1. Check Firebase Console first
2. Review this guide for data structure
3. Contact the development team for custom analytics needs

## 🚀 Future Enhancements

Planned analytics improvements:
- Real-time dashboard within VibeSplit admin panel
- Automated weekly/monthly reports
- A/B testing framework
- Advanced user segmentation
- Predictive analytics for user behavior

---

**Last Updated**: January 27, 2025
**Version**: 1.0
**Contact**: VibeSplit Development Team
