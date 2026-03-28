import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dvabymxhcefstjpzvznw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWJ5bXhoY2Vmc3RqcHp2em53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MTYsImV4cCI6MjA4OTgwNDcxNn0.sSb71BGydWNbIo3jKd-30eAiFNULfs1lKPK5Jz0riJs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
