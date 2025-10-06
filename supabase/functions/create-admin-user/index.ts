import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'viewer' | 'admin' | 'supervisor' | 'super_admin'
  department?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize regular client to verify the requesting user is an admin
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Verify the requesting user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin_or_super_admin', {
      user_id: user.id
    })

    if (adminError || !isAdminData) {
      console.error('Not an admin:', adminError)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can create users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestData: CreateUserRequest = await req.json()
    const { email, password, first_name, last_name, role, department } = requestData

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, first_name, last_name, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the auth user using admin API
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        first_name,
        last_name,
      }
    })

    if (createUserError) {
      console.error('Error creating auth user:', createUserError)
      throw createUserError
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log('Auth user created:', newUser.user.id)

    // The trigger should automatically create the profile, but let's verify/update it
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger to complete

    // Update the profile with department if provided
    if (department) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ department })
        .eq('id', newUser.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // Insert the role into user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      throw roleError
    }

    console.log('User role created successfully')

    // Fetch the complete profile with role
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          ...profile
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error in create-admin-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while creating the user',
        details: error.details || error.hint || undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
