import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  member: OrganizationMember | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    try {
      // Fetch profile
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // If profile doesn't exist yet, create it (avoids reliance on auth triggers)
      if (!profileData) {
        const fallbackName =
          (typeof currentUser.user_metadata?.name === "string" ? currentUser.user_metadata.name : "") ||
          (currentUser.email ? currentUser.email.split("@")[0] : "Usuário");

        const { data: createdProfile, error: createProfileError } = await supabase
          .from("profiles")
          .insert({
            user_id: currentUser.id,
            name: fallbackName,
            email: currentUser.email ?? null,
          })
          .select("*")
          .single();

        if (createProfileError) throw createProfileError;
        profileData = createdProfile;
      }

      setProfile(profileData);

      if (profileData?.organization_id) {
        // Fetch organization
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .maybeSingle();

        setOrganization(orgData);

        // Fetch member record
        const { data: memberData } = await supabase
          .from("organization_members")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("organization_id", profileData.organization_id)
          .maybeSingle();

        setMember(memberData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlock
          setTimeout(() => {
            fetchUserData(currentSession.user);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setMember(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        member,
        isLoading,
        isAuthenticated: !!session,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
