import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { User, Role, PaymentStatus, DocumentStatus, Belt, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { safeDbCall } from '../utils/dbResilience';
import { useQueryClient } from '@tanstack/react-query';

type ConnectionStatus = 'ok' | 'recovering' | 'failed';
type AuthStatus = 'IDLE' | 'CHECKING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR' | 'PASSWORD_RECOVERY';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  connectionStatus: ConnectionStatus;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  saveOnboardingProgress: (data: any) => Promise<void>;
  finalizeOnboarding: () => Promise<void>;
  loading: boolean;
  isProfileLoading: boolean;
  error: string | null;
  needsEmailConfirmation: boolean;
  lastRegisteredEmail: string;
  setNeedsEmailConfirmation: (val: boolean) => void;
  clearError: () => void;
  resetAuth: () => void;
  refreshProfile: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('IDLE');
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('ok' as ConnectionStatus);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState('');
  
  const isFetchingProfile = useRef(false);
  const isInitialized = useRef(false);
  const queryClient = useQueryClient();

  const clearError = () => setError(null);

  const mapProfileToUser = (profile: any, academyInfo: { name: string, phone?: string }, authEmail?: string): User => {
    return {
        id: profile.id,
        federationId: profile.federation_id, 
        fullName: profile.full_name || 'Usuário',
        email: profile.email || authEmail || '',
        dob: profile.dob || '', 
        phone: profile.phone || '',
        role: (profile.role as Role) || Role.STUDENT,
        isBoardingComplete: !!profile.is_boarding_complete,
        isFederationApproved: !!profile.is_federation_approved,
        profileImage: profile.profile_image_url || undefined,
        registrationDate: profile.created_at,
        paymentConfirmedAt: profile.payment_confirmed_at,
        nationality: profile.nationality || 'Brasil',
        cpf: profile.cpf || '',
        gender: profile.gender || '',
        paymentStatus: (profile.payment_status as PaymentStatus) || PaymentStatus.PENDING,
        paymentPlan: profile.payment_plan,
        theme: profile.theme || 'light',
        address: profile.address || undefined,
        athleteData: {
            belt: (profile.belt as Belt) || Belt.WHITE,
            ...profile.belt_history
        },
        documents: {
            identity: { status: (profile.doc_identity_status as DocumentStatus) || DocumentStatus.MISSING, url: profile.doc_identity_url, rejectionReason: profile.doc_identity_reason },
            medical: { status: (profile.doc_medical_status as DocumentStatus) || DocumentStatus.MISSING, url: profile.doc_medical_url, rejectionReason: profile.doc_medical_reason },
            profile: { status: (profile.doc_profile_status as DocumentStatus) || DocumentStatus.MISSING, url: profile.profile_image_url, rejectionReason: profile.doc_profile_reason },
            belt: { status: (profile.doc_belt_status as DocumentStatus) || DocumentStatus.MISSING, url: profile.doc_belt_url, rejectionReason: profile.doc_belt_reason }
        },
        academyId: profile.academy_id,
        academy: profile.academy_id ? { name: academyInfo.name, phone: academyInfo.phone, isOwner: false, status: (profile.academy_status as RegistrationStatus) || RegistrationStatus.PENDING } : undefined
    };
  };

  const loadUserProfile = useCallback(async (userId: string, email: string, force = false) => {
    if (isFetchingProfile.current && !force) return;
    
    isFetchingProfile.current = true;
    setIsProfileLoading(true);
    
    try {
      const result = await safeDbCall(async (signal) => {
        return supabase.from('profiles').select('*').eq('id', userId).maybeSingle().abortSignal(signal!);
      }, { label: 'Auth_LoadProfile', timeout: 7000 });

      if (result.error) throw result.error;
      const profile = result.data;

      if (!profile) {
        const { data: newProfile } = await supabase.from('profiles').insert([{ id: userId, email: email, full_name: 'Atleta', role: Role.STUDENT }]).select().single();
        if (newProfile) setUser(mapProfileToUser(newProfile, { name: 'Sem Academia' }, email));
      } else {
        let academyInfo = { name: 'Não vinculada', phone: undefined };
        if (profile.academy_id) {
            const { data: acData } = await supabase.from('academies').select('name, phone').eq('id', profile.academy_id).maybeSingle();
            if (acData) { academyInfo.name = acData.name; academyInfo.phone = acData.phone; }
        }
        setUser(mapProfileToUser(profile, academyInfo, email));
      }
    } catch (err) {
      console.error("[AUTH] Erro crítico ao carregar perfil:", err);
    } finally {
      isFetchingProfile.current = false;
      setIsProfileLoading(false);
    }
  }, []); 

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id, session.user.email || '', true);
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const initializeAuth = async () => {
      setAuthStatus('CHECKING');
      setLoading(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              setAuthStatus('AUTHENTICATED');
              setLoading(false);
              loadUserProfile(session.user.id, session.user.email || '');
          } else { 
              setAuthStatus('UNAUTHENTICATED'); 
              setLoading(false); 
          }
      } catch (e) {
          setAuthStatus('UNAUTHENTICATED');
          setLoading(false);
      }
    };
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
          setAuthStatus('AUTHENTICATED');
          setLoading(false);
          loadUserProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthStatus('UNAUTHENTICATED');
        setLoading(false);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [loadUserProfile]); 

  const login = async (email: string, password: string) => {
    setError(null); setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      
      if (data.session && data.user) {
          setAuthStatus('AUTHENTICATED');
          setLoading(false); 
          loadUserProfile(data.user.id, data.user.email || '', true);
      } else {
          setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>, password: string) => {
    setError(null); setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email!,
        password: password,
        options: { 
          data: { 
            full_name: userData.fullName,
            dob: userData.dob,
            phone: userData.phone
          }, 
          emailRedirectTo: window.location.origin 
        }
      });
      if (authError) throw authError;

      if (data.session && data.user) {
        setAuthStatus('AUTHENTICATED');
        await loadUserProfile(data.user.id, data.user.email || '', true);
      } else if (data.user && !data.session) {
        setLastRegisteredEmail(userData.email!);
        setNeedsEmailConfirmation(true);
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      queryClient.clear();
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
      await supabase.auth.signOut();
    } catch (err) { console.warn("SignOut falhou", err); } finally { setLoading(false); }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: updates.fullName,
      email: updates.email,
      dob: updates.dob,
      cpf: updates.cpf,
      phone: updates.phone,
      nationality: updates.nationality,
      gender: updates.gender,
      address: updates.address,
      belt: updates.athleteData?.belt,
      belt_history: updates.athleteData,
      theme: updates.theme,
      academy_id: updates.academyId 
    }).eq('id', user.id);
    
    if (error) throw error;
    await refreshProfile();
  };

  const saveOnboardingProgress = async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      nationality: data.nationality,
      cpf: data.cpf,
      gender: data.gender,
      dob: data.dob, 
      address: data.address,
      belt: data.athleteData?.belt,
      academy_id: data.selectedAcademyId,
      role: data.role,
      academy_status: 'PENDING'
    }).eq('id', user.id);

    if (error) throw error;
    await refreshProfile();
  };

  const finalizeOnboarding = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ is_boarding_complete: true }).eq('id', user.id);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated: authStatus === 'AUTHENTICATED', authStatus, connectionStatus,
      login, logout, register, forgotPassword: async () => {}, updatePassword: async () => {},
      updateUser, saveOnboardingProgress, finalizeOnboarding,
      loading, isProfileLoading, error, needsEmailConfirmation, lastRegisteredEmail,
      setNeedsEmailConfirmation, clearError, resetAuth: () => { window.location.reload(); }, 
      refreshProfile, retryConnection: async () => { await refreshProfile(); }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};