import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from '@/types/teamMembers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // Team Member support
  selectedTeamMember: TeamMember | null;
  selectTeamMember: (member: TeamMember) => void;
  clearTeamMember: () => void;
  isSharedAccount: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Team Member state
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(() => {
    const stored = sessionStorage.getItem('selected_team_member');
    return stored ? JSON.parse(stored) : null;
  });
  
  // Check if this is a shared account (e.g., cook@company.com, barista@company.com)
  const [isSharedAccount, setIsSharedAccount] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is a shared account
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          const sharedAccountPrefixes = ['cook@', 'barista@', 'manager@', 'chef@'];
          setIsSharedAccount(sharedAccountPrefixes.some(prefix => email.startsWith(prefix)));
        } else {
          setIsSharedAccount(false);
        }
        
        setLoading(false);
        
        // Clear team member on logout
        if (event === 'SIGNED_OUT') {
          setSelectedTeamMember(null);
          sessionStorage.removeItem('selected_team_member');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if this is a shared account
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase();
        const sharedAccountPrefixes = ['cook@', 'barista@', 'manager@', 'chef@'];
        setIsSharedAccount(sharedAccountPrefixes.some(prefix => email.startsWith(prefix)));
      } else {
        setIsSharedAccount(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: displayName ? { display_name: displayName } : undefined
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear team member selection
    setSelectedTeamMember(null);
    sessionStorage.removeItem('selected_team_member');
    
    await supabase.auth.signOut();
  };

  // Team Member functions
  const selectTeamMember = (member: TeamMember) => {
    setSelectedTeamMember(member);
    sessionStorage.setItem('selected_team_member', JSON.stringify(member));
  };

  const clearTeamMember = () => {
    setSelectedTeamMember(null);
    sessionStorage.removeItem('selected_team_member');
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    selectedTeamMember,
    selectTeamMember,
    clearTeamMember,
    isSharedAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};