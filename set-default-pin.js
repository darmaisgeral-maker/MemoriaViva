import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://amphdsvvndofqmttpjdf.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('ERRO: a variável de ambiente SUPABASE_SERVICE_ROLE_KEY não está definida.')
  process.exit(1)
}

const pinFromArg = process.argv[2]
const PIN = pinFromArg || process.env.DEFAULT_CAREGIVER_PIN

if (!PIN || String(PIN).length !== 4) {
  console.error('Uso: node set-default-pin.js <PIN-4-digits>  OU defina DEFAULT_CAREGIVER_PIN no .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function upsertPin(pin) {
  try {
    const { data, error } = await supabase.from('settings').upsert({ key: 'default_caregiver_pin', value: String(pin) }, { onConflict: 'key' })
    if (error) {
      console.error('Erro ao gravar default_caregiver_pin:', error.message || error)
      process.exit(1)
    }
    console.log('default_caregiver_pin gravado com sucesso. Valor:', String(pin))
    console.log('Resposta do Supabase:', JSON.stringify(data))
  } catch (e) {
    console.error('Erro inesperado:', e)
    process.exit(1)
  }
}

upsertPin(PIN)
