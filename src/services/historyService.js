import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

class HistoryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getUserHistory(userId, maxItems = 20) {
    if (!userId) {
      return this.getGuestHistory();
    }

    const cacheKey = `history_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const history = [];
      
      // First, get trip history from the new trip_history collection
      try {
        const tripHistoryRef = collection(db, 'trip_history');
        console.log('DEBUG: Fetching trip history for userId:', userId);
        // TEMP: Remove userId filter to debug
        const tripHistoryQuery = query(
          tripHistoryRef,
          orderBy('createdAt', 'desc'),
          limit(maxItems)
        );
        
        const tripHistorySnapshot = await getDocs(tripHistoryQuery);
        console.log('DEBUG: tripHistorySnapshot.size:', tripHistorySnapshot.size);
        tripHistorySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('DEBUG: trip_history doc:', data);
          history.push({
            id: data.tripId,
            type: data.category,
            category: data.category,
            title: data.tripName,
            createdAt: data.createdAt,
            memberCount: data.memberCount || 0,
            totalExpenses: 0, // Will be updated if we find the actual trip
            totalAmount: 0,
            lastActivity: data.createdAt,
            status: this.getItemStatus({ createdAt: data.createdAt }),
            isFromHistory: true
          });
        });
      } catch (error) {
        console.warn('Error fetching trip history:', error);
      }
      
      // Then, get additional data from the actual trip collections
      const types = ['trips', 'canteens', 'outings', 'projects'];

      for (const type of types) {
        try {
          const itemsRef = collection(db, type);
          const q = query(
            itemsRef,
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(maxItems)
          );

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const existingIndex = history.findIndex(item => item.id === doc.id);
            
            if (existingIndex >= 0) {
              // Update existing entry with more details
              history[existingIndex] = {
                ...history[existingIndex],
                members: data.members || [],
                totalExpenses: data.expenses?.length || 0,
                totalAmount: this.calculateTotalAmount(data.expenses || []),
                lastActivity: data.lastActivity || data.createdAt,
                status: this.getItemStatus(data)
              };
            } else {
              // Add new entry if not found in trip_history
              history.push({
                id: doc.id,
                type: type.slice(0, -1), // Remove 's' from end
                category: type.slice(0, -1),
                title: data.title || data.name,
                createdAt: data.createdAt,
                members: data.members || [],
                memberCount: data.members?.length || 0,
                totalExpenses: data.expenses?.length || 0,
                totalAmount: this.calculateTotalAmount(data.expenses || []),
                lastActivity: data.lastActivity || data.createdAt,
                status: this.getItemStatus(data)
              });
            }
          });
        } catch (error) {
          console.warn(`Error fetching ${type}:`, error);
        }
      }

      // Sort by last activity
      history.sort((a, b) => {
        const aDate = new Date(a.lastActivity || a.createdAt);
        const bDate = new Date(b.lastActivity || b.createdAt);
        return bDate - aDate;
      });
      
      // Limit to maxItems
      const limitedHistory = history.slice(0, maxItems);

      // Cache the result
      this.cache.set(cacheKey, {
        data: limitedHistory,
        timestamp: Date.now()
      });

      return limitedHistory;
    } catch (error) {
      console.error('Error fetching user history:', error);
      return [];
    }
  }

  getGuestHistory() {
    try {
      const types = ['trips', 'canteens', 'outings', 'projects'];
      const history = [];

      types.forEach(type => {
        const items = JSON.parse(localStorage.getItem(type) || '[]');
        items.forEach(item => {
          history.push({
            id: item.id,
            type: type.slice(0, -1),
            title: item.title || item.name,
            createdAt: item.createdAt,
            members: item.members || [],
            totalExpenses: item.expenses?.length || 0,
            totalAmount: this.calculateTotalAmount(item.expenses || []),
            lastActivity: item.lastActivity || item.createdAt,
            status: this.getItemStatus(item),
            isGuest: true
          });
        });
      });

      // Sort by last activity
      history.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      
      return history.slice(0, 20);
    } catch (error) {
      console.error('Error fetching guest history:', error);
      return [];
    }
  }

  calculateTotalAmount(expenses) {
    return expenses.reduce((total, expense) => {
      return total + (parseFloat(expense.amount) || 0);
    }, 0);
  }

  getItemStatus(item) {
    const now = new Date();
    const lastActivity = new Date(item.lastActivity || item.createdAt);
    const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity === 0) return 'active';
    if (daysSinceActivity <= 7) return 'recent';
    if (daysSinceActivity <= 30) return 'inactive';
    return 'archived';
  }

  async getRecentActivities(userId, limit = 10) {
    try {
      const activities = JSON.parse(localStorage.getItem('vibesplit_activities') || '[]');
      
      return activities
        .filter(activity => !userId || activity.user?.uid === userId)
        .slice(-limit)
        .reverse();
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  getStatistics(history) {
    const stats = {
      totalTrips: 0,
      totalExpenses: 0,
      totalAmount: 0,
      favoriteType: null,
      averageGroupSize: 0,
      mostActiveMonth: null
    };

    if (history.length === 0) return stats;

    const typeCount = {};
    const monthCount = {};
    let totalMembers = 0;

    history.forEach(item => {
      stats.totalTrips++;
      stats.totalExpenses += item.totalExpenses;
      stats.totalAmount += item.totalAmount;
      totalMembers += item.members.length;

      // Count types
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;

      // Count months
      const month = new Date(item.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      monthCount[month] = (monthCount[month] || 0) + 1;
    });

    // Find favorite type
    stats.favoriteType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b
    );

    // Calculate average group size
    stats.averageGroupSize = Math.round(totalMembers / history.length);

    // Find most active month
    if (Object.keys(monthCount).length > 0) {
      stats.mostActiveMonth = Object.keys(monthCount).reduce((a, b) => 
        monthCount[a] > monthCount[b] ? a : b
      );
    }

    return stats;
  }

  clearCache() {
    this.cache.clear();
  }

  trackItemActivity(itemId, itemType, action) {
    try {
      const activity = {
        itemId,
        itemType,
        action,
        timestamp: new Date().toISOString()
      };

      const activities = JSON.parse(localStorage.getItem('vibesplit_item_activities') || '[]');
      activities.push(activity);

      // Keep only last 500 activities
      if (activities.length > 500) {
        activities.splice(0, activities.length - 500);
      }

      localStorage.setItem('vibesplit_item_activities', JSON.stringify(activities));
    } catch (error) {
      console.warn('Failed to track item activity:', error);
    }
  }
}

const historyService = new HistoryService();
export default historyService;
