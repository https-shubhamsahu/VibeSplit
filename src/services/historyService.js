import { db } from '../firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

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
      
      // First, get trip history from the trip_history collection (with user filtering)
      try {
        const tripHistoryRef = collection(db, 'trip_history');
        const tripHistoryQuery = query(
          tripHistoryRef,
          where('createdBy', '==', userId),
          limit(maxItems)
        );
        
        const tripHistorySnapshot = await getDocs(tripHistoryQuery);
        tripHistorySnapshot.forEach((doc) => {
          const data = doc.data();
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
          
          // Process trips created by the user
          const processSnapshot = (snapshot) => {
            snapshot.forEach((doc) => {
              const data = doc.data();
              const existingIndex = history.findIndex(item => item.id === doc.id);
              
              if (existingIndex >= 0) {
                // Update existing entry with more details
                history[existingIndex] = {
                  ...history[existingIndex],
                  members: data.members || [],
                  totalExpenses: data.expenses?.length || 0,
                  totalAmount: this.calculateTotalAmount(data.expenses || []),
                  lastActivity: (() => {
  if (data.lastActivity && !isNaN(new Date(data.lastActivity))) return data.lastActivity;
  if (Array.isArray(data.expenses) && data.expenses.length > 0) {
    // Find the latest valid expense date
    const validDates = data.expenses
      .map(e => e.date)
      .filter(d => d && !isNaN(new Date(d)))
      .sort((a, b) => new Date(b) - new Date(a));
    if (validDates.length > 0) return validDates[0];
  }
  return data.createdAt;
})(),
                  status: this.getItemStatus(data)
                };
              } else {
                // Add new entry
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
                  lastActivity: (() => {
  if (data.lastActivity && !isNaN(new Date(data.lastActivity))) return data.lastActivity;
  if (Array.isArray(data.expenses) && data.expenses.length > 0) {
    // Find the latest valid expense date
    const validDates = data.expenses
      .map(e => e.date)
      .filter(d => d && !isNaN(new Date(d)))
      .sort((a, b) => new Date(b) - new Date(a));
    if (validDates.length > 0) return validDates[0];
  }
  return data.createdAt;
})(),
                  status: this.getItemStatus(data)
                });
              }
            });
          };
          
          // Get trips created by the user
          const createdByUserQuery = query(
            itemsRef,
            where('createdBy', '==', userId),
            limit(maxItems)
          );
          
          const createdByUserSnapshot = await getDocs(createdByUserQuery);
          processSnapshot(createdByUserSnapshot);
          
          // Get trips where user is a member (fallback method)
          const allTripsQuery = query(
            itemsRef,
            limit(100) // Reasonable limit for manual filtering
          );
          
          const allTripsSnapshot = await getDocs(allTripsQuery);
          allTripsSnapshot.forEach((doc) => {
            const data = doc.data();
            // Check if user is a member and not already added as creator
            const isMember = data.members?.some(member => 
              (member.id && member.id === userId) ||
              (member.email && member.email === userId) ||
              (typeof member === 'string' && member === userId)
            );
            
            const alreadyExists = history.some(item => item.id === doc.id);
            
            if (isMember && !alreadyExists) {
              history.push({
                id: doc.id,
                type: type.slice(0, -1),
                category: type.slice(0, -1),
                title: data.title || data.name,
                createdAt: data.createdAt,
                members: data.members || [],
                memberCount: data.members?.length || 0,
                totalExpenses: data.expenses?.length || 0,
                totalAmount: this.calculateTotalAmount(data.expenses || []),
                lastActivity: (() => {
  if (data.lastActivity && !isNaN(new Date(data.lastActivity))) return data.lastActivity;
  if (Array.isArray(data.expenses) && data.expenses.length > 0) {
    // Find the latest valid expense date
    const validDates = data.expenses
      .map(e => e.date)
      .filter(d => d && !isNaN(new Date(d)))
      .sort((a, b) => new Date(b) - new Date(a));
    if (validDates.length > 0) return validDates[0];
  }
  return data.createdAt;
})(),
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

      // Helper to get the last activity date
      function getLastActivity(item) {
        // Use lastActivity if valid
        if (item.lastActivity && !isNaN(new Date(item.lastActivity))) return item.lastActivity;
        // Fallback: use last expense date if exists
        if (Array.isArray(item.expenses) && item.expenses.length > 0) {
          const lastExp = item.expenses[item.expenses.length - 1];
          if (lastExp.date && !isNaN(new Date(lastExp.date))) return lastExp.date;
        }
        // Otherwise, use createdAt
        return item.createdAt;
      }
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
            lastActivity: getLastActivity(item),
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

  // Clear cache for a specific user (call this when new trips are created)
  clearUserCache(userId) {
    if (userId) {
      const cacheKey = `history_${userId}`;
      this.cache.delete(cacheKey);
    }
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const history = await this.getUserHistory(userId);
      const totalTrips = history.length;
      const totalExpenses = history.reduce((sum, trip) => sum + (trip.totalExpenses || 0), 0);
      const totalAmount = history.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
      
      // Calculate average group size
      const totalMembers = history.reduce((sum, trip) => sum + (Array.isArray(trip.members) ? trip.members.length : 0), 0);
      const averageGroupSize = totalTrips > 0 ? Math.round(totalMembers / totalTrips) : 0;

      return {
        totalTrips,
        totalExpenses,
        totalAmount,
        averageGroupSize
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { totalTrips: 0, totalExpenses: 0, totalAmount: 0, averageGroupSize: 0 };
    }
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
