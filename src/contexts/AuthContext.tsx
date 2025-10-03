import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  department?: string
  phone?: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  isRecoveringPassword: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)

  // Fetch roles from user_roles table instead of profiles
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSuperAdmin = userRole === 'super_admin'

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // First, get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (sessionError) {
          console.error('Session error:', sessionError)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        // If we have a user, fetch their profile and role immediately
        if (session?.user && isMounted) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()

            if (!isMounted) return

            if (profileError) {
              console.error('Error fetching profile:', profileError)
              setProfile(null)
            } else {
              setProfile(profileData)
            }

            // Fetch user role from user_roles table
            const { data: roleData, error: roleError } = await supabase
              .rpc('get_user_highest_role', { _user_id: session.user.id })

            if (!isMounted) return

            if (roleError) {
              console.error('Error fetching role:', roleError)
              setUserRole(null)
            } else {
              setUserRole(roleData as UserRole)
            }
          } catch (error) {
            console.error('Profile/role fetch error:', error)
            setProfile(null)
            setUserRole(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('Auth event:', event, session)

        // Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveringPassword(true)
          toast.success('You can now set a new password')
        } else {
          setIsRecoveringPassword(false)
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            if (!isMounted) return
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()

              if (isMounted) {
                if (error) {
                  console.error('Error fetching profile:', error)
                  setProfile(null)
                } else {
                  setProfile(profileData)
                }
              }

              // Fetch user role from user_roles table
              const { data: roleData, error: roleError } = await supabase
                .rpc('get_user_highest_role', { _user_id: session.user.id })

              if (isMounted) {
                if (roleError) {
                  console.error('Error fetching role:', roleError)
                  setUserRole(null)
                } else {
                  setUserRole(roleData as UserRole)
                }
              }
            } catch (error) {
              console.error('Profile/role fetch error:', error)
              if (isMounted) {
                setProfile(null)
                setUserRole(null)
              }
            }
          }, 100)
        } else {
          if (isMounted) {
            setProfile(null)
            setUserRole(null)
          }
        }
      }
    )

    // Initialize auth
    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // Log failed login attempt for security monitoring
        try {
          await supabase.from('failed_login_attempts').insert({
            email,
            user_agent: navigator.userAgent,
          })
        } catch (logError) {
          console.error('Failed to log login attempt:', logError)
        }
        
        toast.error('Login failed: ' + error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      const authError = error as Error
      
      // Log failed login attempt for security monitoring
      try {
        await supabase.from('failed_login_attempts').insert({
          email,
          user_agent: navigator.userAgent,
        })
      } catch (logError) {
        console.error('Failed to log login attempt:', logError)
      }
      
      toast.error('Login failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true)
      const redirectUrl = `${window.location.origin}/`
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) {
        toast.error('Sign up failed: ' + error.message)
        return { error }
      }

      toast.success('Account created successfully! Please check your email to verify your account.')
      return { error: null }
    } catch (error) {
      const authError = error as Error
      toast.error('Sign up failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Sign out failed: ' + error.message)
      } else {
        toast.success('Signed out successfully')
      }
    } catch (error) {
      toast.error('Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      const redirectUrl = `${window.location.origin}/auth`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        toast.error('Password reset failed: ' + error.message)
        return { error }
      }

      toast.success('Password reset email sent! Please check your inbox.')
      return { error: null }
    } catch (error) {
      const authError = error as Error
      toast.error('Password reset failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error('Password update failed: ' + error.message)
        return { error }
      }

      toast.success('Password updated successfully!')
      setIsRecoveringPassword(false)
      return { error: null }
    } catch (error) {
      const authError = error as Error
      toast.error('Password update failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isRecoveringPassword,
    isAdmin,
    isSuperAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}