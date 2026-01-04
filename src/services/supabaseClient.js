import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.benneuendorf.com'
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0ODAxODEwMCwiZXhwIjo0OTAzNjkxNzAwLCJyb2xlIjoiYW5vbiJ9.7sYj8BXbWTc12HDynzELLxmkcmVVJ_-VRTW-sz02ads'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)