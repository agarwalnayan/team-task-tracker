import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';
import { extractData } from '../utils/extractData';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();
  const currentUserId = user?._id;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications?limit=50&userId=${currentUserId}`);
      setNotifications(extractData(response));
      setUnreadCount(response.pagination?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewNotification = (notification) => {
      // Only add notification if it's for the current user
      if (notification.user === currentUserId || notification.user?._id === currentUserId) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    // Listen for user-specific notifications
    const handleUserNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on(`notification:${currentUserId}`, handleUserNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off(`notification:${currentUserId}`, handleUserNotification);
    };
  }, [socket, currentUserId]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
};