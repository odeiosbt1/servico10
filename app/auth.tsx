import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { signInWithEmail, signUpWithEmail, resetPassword, createUserProfile } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const { userType } = useLocalSearchParams<{ userType?: string }>();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'userType' | 'auth'>('userType');
  const [selectedUserType, setSelectedUserType] = useState<'prestador' | 'contratante' | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userType) {
      setSelectedUserType(userType as 'prestador' | 'contratante');
      setCurrentStep('auth');
    }
  }, [userType]);

  useEffect(() => {
    if (user) {
      if (selectedUserType) {
        router.replace(`/profile-setup?userType=${selectedUserType}`);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, selectedUserType]);

  const handleUserTypeSelection = (type: 'prestador' | 'contratante') => {
    setSelectedUserType(type);
    setCurrentStep('auth');
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      let firebaseUser;
      
      if (isLogin) {
        firebaseUser = await signInWithEmail(email, password);
      } else {
        firebaseUser = await signUpWithEmail(email, password);
        
        if (selectedUserType && firebaseUser) {
          await createUserProfile(firebaseUser, { 
            userType: selectedUserType,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null
          });
          
          Alert.alert(
            'Cadastro Criado!',
            'Sua conta foi criada com sucesso. Complete seu perfil para começar a usar o app.',
            [{ text: 'OK' }]
          );
        }
      }

      if (selectedUserType) {
        router.replace(`/profile-setup?userType=${selectedUserType}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Erro', error.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Digite seu email para recuperar a senha.');
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert('Sucesso', 'Email de recuperação de senha enviado!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar email de recuperação.');
    }
  };

  if (currentStep === 'userType') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' }}
              style={styles.heroImage}
            />
            <Text style={styles.title}>Bem-vindo ao Serviço Fácil</Text>
            <Text style={styles.subtitle}>
              Conectamos pessoas que precisam de serviços com prestadores qualificados
            </Text>
          </View>

          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeTitle}>Como você quer usar o app?</Text>
            
            <TouchableOpacity
              style={styles.userTypeCard}
              onPress={() => handleUserTypeSelection('contratante')}
            >
              <User size={40} color="#2563eb" />
              <Text style={styles.userTypeCardTitle}>Sou Cliente</Text>
              <Text style={styles.userTypeCardDescription}>
                Procuro prestadores de serviços para resolver minhas necessidades
              </Text>
              <View style={styles.userTypeFeatures}>
                <Text style={styles.featureText}>• Encontrar prestadores próximos</Text>
                <Text style={styles.featureText}>• Conversar diretamente</Text>
                <Text style={styles.featureText}>• Avaliar serviços</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userTypeCard}
              onPress={() => handleUserTypeSelection('prestador')}
            >
              <Briefcase size={40} color="#2563eb" />
              <Text style={styles.userTypeCardTitle}>Sou Prestador</Text>
              <Text style={styles.userTypeCardDescription}>
                Ofereço serviços e quero encontrar novos clientes na região
              </Text>
              <View style={styles.userTypeFeatures}>
                <Text style={styles.featureText}>• Receber solicitações</Text>
                <Text style={styles.featureText}>• Gerenciar disponibilidade</Text>
                <Text style={styles.featureText}>• Construir reputação</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => setCurrentStep('auth')}>
              <Text style={styles.loginPromptLink}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentStep('userType')}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Entre com sua conta para continuar' 
              : 'Preencha os dados para criar sua conta'
            }
          </Text>
          {selectedUserType && (
            <View style={styles.userTypeBadge}>
              {selectedUserType === 'prestador' ? (
                <Briefcase size={16} color="#2563eb" />
              ) : (
                <User size={16} color="#2563eb" />
              )}
              <Text style={styles.userTypeText}>
                {selectedUserType === 'prestador' ? 'Prestador de Serviço' : 'Cliente'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#64748b" />
              ) : (
                <Eye size={20} color="#64748b" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input (only for sign up) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}

          {/* Forgot Password Link */}
          {isLogin && (
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          )}

          {/* Auth Button */}
          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading 
                ? (isLogin ? 'Entrando...' : 'Criando conta...') 
                : (isLogin ? 'Entrar' : 'Criar conta')
              }
            </Text>
          </TouchableOpacity>

          {/* Toggle Auth Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  userTypeText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  userTypeContainer: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  userTypeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userTypeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  userTypeCardDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  userTypeFeatures: {
    alignSelf: 'stretch',
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    textAlign: 'left',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#64748b',
  },
  loginPromptLink: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 4,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#64748b',
  },
  toggleLink: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 4,
  },
});