import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { MessageCircle, Lock } from 'lucide-react-native';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types';
import { router } from 'expo-router';

export default function ChatScreen() {
  const { user, isProfileComplete } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isProfileComplete) {
      setLoading(false);
      return;
    }

    loadChats();
  }, [user, isProfileComplete]);

  const loadChats = () => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsData: Chat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chatsData.push({
          id: doc.id,
          ...data,
          lastMessageTime: data.lastMessageTime?.toDate(),
        } as Chat);
      });
      setChats(chatsData);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleChatPress = (chat: Chat) => {
    // Navigate to specific chat
    router.push(`/chat/${chat.id}`);
  };

  const requireLogin = () => {
    Alert.alert(
      'Login Necessário',
      'Você precisa fazer login e completar seu perfil para acessar o chat.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fazer Login', onPress: () => router.push('/auth') },
      ]
    );
  };

  if (!user || !isProfileComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Lock size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>Chat Privado</Text>
          <Text style={styles.emptyText}>
            Faça login e complete seu perfil para acessar o chat e se comunicar com prestadores de serviço.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={requireLogin}>
            <Text style={styles.loginButtonText}>Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Carregando conversas...</Text>
        </View>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MessageCircle size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
          <Text style={styles.emptyText}>
            Você ainda não tem conversas. Entre em contato com prestadores de serviço para iniciar uma conversa.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatsList}>
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() => handleChatPress(chat)}
          >
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>
                {chat.participantNames[chat.participants.find(p => p !== user.uid) || '']}
              </Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage || 'Nova conversa'}
              </Text>
            </View>
            <View style={styles.chatMeta}>
              <Text style={styles.timestamp}>
                {chat.lastMessageTime?.toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatsList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
});