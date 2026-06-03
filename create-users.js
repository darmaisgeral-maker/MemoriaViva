import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://amphdsvvndofqmttpjdf.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('ERRO: a variável de ambiente SUPABASE_SERVICE_ROLE_KEY não está definida.')
  console.error('Defina-a em .env ou no seu ambiente antes de executar o script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
})

const csvFile = path.resolve(process.cwd(), 'utentes.csv')

const defaultUtentes = [
  { name: 'Nome Exemplo', email: 'exemplo@email.com' }
]

function generatePassword() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16)
}

function parseCsv(content) {
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(','))
    .map(([name = '', email = '']) => ({ name: name.trim(), email: email.trim() }))
    .filter((row) => row.name && row.email)

  if (rows.length > 0 && rows[0].name.toLowerCase() === 'name' && rows[0].email.toLowerCase() === 'email') {
    return rows.slice(1)
  }

  return rows
}

async function loadUtentes() {
  try {
    const raw = await fs.readFile(csvFile, 'utf8')
    const rows = parseCsv(raw)
    if (rows.length === 0) {
      console.warn('Aviso: utentes.csv foi encontrado, mas não contém utentes válidos. Usando a lista padrão no script.')
      return defaultUtentes
    }
    return rows
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('Aviso: utentes.csv não encontrado. Usando a lista padrão no script.')
      return defaultUtentes
    }
    throw error
  }
}

async function createOrUpdateUtente({ name, email }) {
  const account = {
    email,
    password: generatePassword(),
    confirmed: false,
    created: false,
    error: null,
    profileUpserted: false,
    userId: null
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true
    })

    if (error) {
      if (error.message.includes('User already exists') || error.message.includes('already been registered')) {
        account.error = 'Utilizador de autenticação já existe. Não foi criado novamente.'
        account.password = ''
      } else {
        account.error = error.message
      }
    } else {
      account.created = true
      account.userId = data?.user?.id ?? null
    }
  } catch (error) {
    account.error = String(error)
  }

  const { error: upsertError } = await supabase
    .from('utentes')
    .upsert({ email, name }, { onConflict: ['email'] })

  if (upsertError) {
    account.error = account.error ? `${account.error} | ${upsertError.message}` : upsertError.message
  } else {
    account.profileUpserted = true
  }

  return account
}

async function main() {
  const utentes = await loadUtentes()

  if (utentes.length === 0) {
    console.error('Nenhum utente encontrado para processar.')
    process.exit(1)
  }

  console.log(`Processando ${utentes.length} utente(s) para criação/upsert...`)

  const results = []

  for (const utente of utentes) {
    const result = await createOrUpdateUtente(utente)
    results.push({
      email: utente.email,
      name: utente.name,
      password: result.password,
      created: result.created ? 'sim' : 'não',
      profileUpserted: result.profileUpserted ? 'sim' : 'não',
      error: result.error || ''
    })
  }

  console.log('\nResultado final:')
  console.table(results, ['email', 'name', 'password', 'created', 'profileUpserted', 'error'])

  const outputFile = path.resolve(process.cwd(), 'utentes-criados.csv')
  const csvEscape = (value) => `"${String(value || '').replace(/"/g, '""')}"`
  const csvHeader = ['name', 'email', 'password', 'created', 'profileUpserted', 'error'].join(',')
  const csvRows = results.map((row) => [
    csvEscape(row.name),
    csvEscape(row.email),
    csvEscape(row.password),
    csvEscape(row.created),
    csvEscape(row.profileUpserted),
    csvEscape(row.error)
  ].join(','))

  await fs.writeFile(outputFile, [csvHeader, ...csvRows].join('\r\n'), 'utf8')
  console.log(`\nArquivo gerado: ${outputFile}`)
  console.log('\nNotas:')
  console.log('- Se o utilizador já existir na autenticação, o script só faz o upsert no perfil.')
  console.log('- Guarde estes dados com segurança antes de enviar às famílias.')
}

main().catch((error) => {
  console.error('Erro fatal:', error)
  process.exit(1)
})
