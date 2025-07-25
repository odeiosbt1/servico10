import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { User, Settings, Star, MessageCircle, LogOut, CreditCard as Edit, UserPlus, Briefcase, Calendar, Clock, Award, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { logOut, updateUserProfile } from '@/services/auth';
import { getProviderReviews } from '@/services/reviews';
import { getProviderStats, ProviderStats } from '@/services/stats';
import { ReviewCard } from '@/components/ReviewCard';
import { StatsCard } from '@/components/StatsCard';
import { Review } from '@/types';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { user, userProfile, isProfileComplete, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && userProfile?.userType === 'prestador') {
      loadProviderData();
    }
  }, [user, userProfile]);

  const loadProviderData = async () => {
    if (!user) return;
    
    try {
      const [reviewsData, statsData] = await Promise.all([
        getProviderReviews(user.uid),
        getProviderStats(user.uid)
      ]);
      
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProviderData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logOut();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const navigateToAuth = () => {
    router.push('/auth');
  };

  const navigateToProfileSetup = () => {
    router.push('/profile-setup');
  };

  const handleUserTypeSelection = (userType: 'prestador' | 'contratante') => {
    router.push(`/auth?userType=${userType}`);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <User size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>Criar Conta ou Fazer Login</Text>
          <Text style={styles.emptyText}>
            Escolha o tipo de perfil que melhor descreve você ou faça login se já tem uma conta.
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleUserTypeSelection('contratante')}
            >
              <User size={32} color="#2563eb" />
              <Text style={styles.optionTitle}>Sou Cliente</Text>
              <Text style={styles.optionDescription}>
                Procuro prestadores de serviços
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleUserTypeSelection('prestador')}
            >
              <Briefcase size={32} color="#2563eb" />
              <Text style={styles.optionTitle}>Sou Prestador</Text>
              <Text style={styles.optionDescription}>
                Ofereço serviços na região
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginSectionText}>Já tem uma conta?</Text>
            <TouchableOpacity style={styles.loginButton} onPress={navigateToAuth}>
              <Text style={styles.loginButtonText}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!isProfileComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Edit size={64} color="#f59e0b" />
          <Text style={styles.emptyTitle}>Complete seu Perfil</Text>
          <Text style={styles.emptyText}>
            Finalize o cadastro para aproveitar todos os recursos do app.
          </Text>
          <TouchableOpacity style={styles.completeButton} onPress={navigateToProfileSetup}>
            <Text style={styles.completeButtonText}>Completar Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusColor = (status?: string) => {
    return status === 'disponivel' ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (status?: string) => {
    return status === 'disponivel' ? 'Disponível' : 'Ocupado';
  };

  const handleStatusToggle = () => {
    if (!user || !userProfile || userProfile.userType !== 'prestador') return;

    const newStatus = userProfile.status === 'disponivel' ? 'ocupado' : 'disponivel';
    
    Alert.alert(
      'Alterar Status',
      `Deseja alterar seu status para "${getStatusText(newStatus)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateUserProfile(user.uid, { status: newStatus });
              await refreshProfile();
              Alert.alert('Sucesso', `Status alterado para "${getStatusText(newStatus)}"`);
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Erro', 'Falha ao alterar status. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri: userProfile?.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userProfile?.displayName}</Text>
          <Text style={styles.email}>{userProfile?.email}</Text>
          
          {userProfile?.userType === 'prestador' && (
            <>
              <Text style={styles.service}>{userProfile.serviceType}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(userProfile.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(userProfile.status) }]}>
                  {getStatusText(userProfile.status)}
                </Text>
              </View>
              
              {userProfile.rating !== undefined && (
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingText}>
                    {userProfile.rating.toFixed(1)} ({userProfile.reviewCount} avaliações)
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Provider Stats */}
        {userProfile?.userType === 'prestador' && stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatsCard
                  icon={<Star size={20} color="#fbbf24" />}
                  title="Avaliações"
                  value={stats.totalReviews}
                  subtitle={`${stats.averageRating} estrelas`}
                  color="#fbbf24"
                />
                <StatsCard
                  icon={<MessageCircle size={20} color="#2563eb" />}
                  title="Conversas"
                  value={stats.totalChats}
                  subtitle="Total de chats"
                  color="#2563eb"
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  icon={<Award size={20} color="#22c55e" />}
                  title="Serviços"
                  value={stats.completedServices}
                  subtitle="Concluídos"
                  color="#22c55e"
                />
                <StatsCard
                  icon={<Clock size={20} color="#f59e0b" />}
                  title="Resposta"
                  value={stats.responseTime}
                  subtitle="Tempo médio"
                  color="#f59e0b"
                />
              </View>
            </View>
          </View>
        )}

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Usuário</Text>
            <Text style={styles.infoValue}>
              {userProfile?.userType === 'prestador' ? 'Prestador de Serviço' : 'Cliente'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{userProfile?.phone || 'Não informado'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Bairro</Text>
            <Text style={styles.infoValue}>{userProfile?.neighborhood || 'Não informado'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>CPF</Text>
            <Text style={styles.infoValue}>{userProfile?.cpf || 'Não informado'}</Text>
          </View>
          {userProfile?.userType === 'prestador' && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Membro desde</Text>
              <Text style={styles.infoValue}>
                {stats?.joinDate.toLocaleDateString('pt-BR') || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Reviews Section for Providers */}
        {userProfile?.userType === 'prestador' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Avaliações Recebidas</Text>
              <View style={styles.reviewsBadge}>
                <Text style={styles.reviewsBadgeText}>{reviews.length}</Text>
              </View>
            </View>
            
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {reviews.length > 5 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>
                      Ver todas as {reviews.length} avaliações
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyReviews}>
                <Star size={32} color="#d1d5db" />
                <Text style={styles.emptyReviewsText}>
                  Ainda não há avaliações
                </Text>
                <Text style={styles.emptyReviewsSubtext}>
                  Complete alguns serviços para receber suas primeiras avaliações
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          {userProfile?.userType === 'prestador' && (
            <TouchableOpacity style={styles.actionItem} onPress={handleStatusToggle}>
              <View style={styles.actionLeft}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(userProfile.status) }]} />
                <Text style={styles.actionText}>Alterar Status</Text>
              </View>
              <Text style={styles.actionValue}>{getStatusText(userProfile.status)}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionItem} onPress={navigateToProfileSetup}>
            <View style={styles.actionLeft}>
              <Edit size={20} color="#64748b" />
              <Text style={styles.actionText}>Editar Perfil</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => router.push('/settings')}
          >
            <View style={styles.actionLeft}>
              <Settings size={20} color="#64748b" />
              <Text style={styles.actionText}>Configurações</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, styles.logoutItem]} 
            onPress={handleLogout}
            disabled={loading}
          >
            <View style={styles.actionLeft}>
              <LogOut size={20} color="#ef4444" />
              <Text style={[styles.actionText, styles.logoutText]}>
                {loading ? 'Saindo...' : 'Sair da Conta'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  service: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  actionValue: {
    fontSize: 14,
    color: '#64748b',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#ef4444',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginVertical: 24,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginSectionText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  statsGrid: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  reviewsBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  reviewsBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewsList: {
    paddingHorizontal: 16,
  },
  viewAllButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});