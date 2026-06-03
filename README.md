# Memória Viva - Criação em lote de contas de utentes

Este repositório contém um script Node.js para criar contas de utentes no Supabase e fazer upsert de perfis na tabela `utentes`.

## Arquivos

- `create-users.js`: script principal
- `package.json`: dependências e script de execução
- `.gitignore`: ignora `.env` e `node_modules`
- `.env.example`: exemplo de configuração de ambiente
- `utentes.csv`: lista de utentes (exemplo)

## Configuração

1. Copie `.env.example` para `.env`.
2. No painel Supabase do projeto, vá para `Settings` → `API`.
3. Copie a `SERVICE ROLE KEY`.
4. Defina no `.env`:

```text
SUPABASE_URL=https://amphdsvvndofqmttpjdf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_sb_secret_key_here
```

> Use a chave de servidor secreta (`sb_secret_...`) do Supabase. **Não use** a chave publicável (`sb_publishable_...`).
> Se quiser, pode omitir `SUPABASE_URL` no `.env`, já que o script usa o valor padrão do projeto.

## Formato do `utentes.csv`

O ficheiro deve ter cabeçalho e colunas `name,email`:

```csv
name,email
Maria Silva,maria.silva@example.com
João Pereira,joao.pereira@example.com
```

## Instalação e execução

```powershell
cd "c:\Users\USER\Desktop\Memória Viva app"
npm install
npm run create-users
```

## O que acontece

- cada utente é criado no Auth do Supabase com `email_confirm` definido como `true`
- a tabela `utentes` recebe um upsert pelo `email`
- se o email já existir no Auth, o perfil é atualizado sem criar nova conta
- o script imprime uma tabela com o resultado
- é gerado um ficheiro `utentes-criados.csv` com as mesmas informações

## Observações de segurança

- não coloque a `SERVICE_ROLE_KEY` no código
- mantenha `.env` em `.gitignore`
- guarde os dados de login com segurança antes de partilhar com famílias

## Definir PIN padrão do Cuidador (global)

Para suportar um PIN padrão partilhado entre dispositivos, a app lê a chave `default_caregiver_pin` na tabela `settings`.

1. Crie a tabela executando o ficheiro SQL em `sql/create_settings.sql` no SQL editor do Supabase.

2. Para gravar o PIN usando a `SERVICE_ROLE_KEY` (recomendado, server-side), use o script Node incluído:

```powershell
# A opção 1: passar o PIN como argumento
node set-default-pin.js 5678

# A opção 2: definir no .env e executar
# DEFAULT_CAREGIVER_PIN=5678
node set-default-pin.js
```

O script usa a `SUPABASE_SERVICE_ROLE_KEY` para fazer um `upsert` na tabela `settings` com `key='default_caregiver_pin'`.

3. Alternativa: permitir leitura na tabela `settings` desde o frontend (ex.: criar uma policy SELECT pública) — tenha cuidado com a segurança. Exemplos e sugestões estão no ficheiro `sql/create_settings.sql`.

## Deploy no Netlify

Pode fazer o deploy estático da app no Netlify. Passos rápidos:

1. No Netlify, crie um novo site a partir do repositório (GitHub/GitLab/Bitbucket) ou use _Drag & Drop_ do diretório local.
2. Configure o site para publicar a raiz do repositório (publish dir = `.`) e deixe o comando de build vazio (app é um ficheiro estático `index.html`).
3. O ficheiro `netlify.toml` já inclui um redirect para `index.html` (fallback SPA).
4. Certifique-se de não expor a `SUPABASE_SERVICE_ROLE_KEY` — deixe qualquer script que use a chave no servidor (não comite `.env`).

Dica: para imagens e ficheiros que precise servir publicamente (por exemplo, fotos de contactos), considere usar um Storage bucket (por exemplo Supabase Storage) e guardar apenas as URLs no ficheiro local/DB.

