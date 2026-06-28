// @build: 2026-06-27.14-00-00 | id: B0-CONFIG-V2 | desc: Cliente admin de Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) throw new Error('Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

module.exports = supabaseAdmin
