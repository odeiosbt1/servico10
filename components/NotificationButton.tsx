import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { Bell, X, MessageCircle, Star, Briefcase } from 'lucide-react-native';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'message' | 'review' | 'service';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export const NotificationButton: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen for new messages
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc'),
      limit(10)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const messageNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastMessage && data.lastMessageTime) {
          const otherParticipant = data.participants.find((p: string) => p !== user.uid);
          const senderName = data.participantNames[otherParticipant] || 'Usuário';
          
          messageNotifications.push({
            id: `message-${doc.id}`,
            type: 'message',
            title: `Nova mensagem de ${senderName}`,
            message: data.lastMessage,
            timestamp: data.lastMessageTime.toDate(),
            read: false,
            data: { chatId: doc.id }
          });
        }
      });

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'message');
        return [...messageNotifications, ...filtered].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
      });
    });

    // Listen for new reviews (if user is a provider)
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(
      reviewsRef,
      where('providerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviewNotifications.push({
          id: `review-${doc.id}`,
          type: 'review',
          title: `Nova avaliação de ${data.clientName}`,
          message: `${data.rating} estrelas: ${data.comment}`,
          timestamp: data.createdAt.toDate(),
          read: false,
          data: { reviewId: doc.id }
        });
      });

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'review');
        return [...reviewNotifications, ...filtered].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
      });
    });

    return () => {
      unsubscribeChats();
      unsubscribeReviews();
    };
  }, [user]);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={20} color="#2563eb" />;
      case 'review':
        return <Star size={20} color="#fbbf24" />;
      case 'service':
        return <Briefcase size={20} color="#22c55e" />;
      default:
        return <Bell size={20} color="#64748b" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setShowModal(true)}
      >
        <Bell size={24} color="#2563eb" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificações</Text>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                  <Text style={styles.emptyText}>
                    Você receberá notificações sobre mensagens, avaliações e atualizações aqui.
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.timestamp)}
                      </Text>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllRead: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 8,
  },
});