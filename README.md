# 🎉 Realiza Festa — Sistema de Gestão

## Setup rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.local` e preencha com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 3. Criar banco de dados no Supabase
- Acesse supabase.com → seu projeto → SQL Editor
- Cole e execute o conteúdo de `supabase/migrations/001_initial_schema.sql`

### 4. Criar usuários (Clara e Marcelo)
Após o banco criado, faça uma chamada POST para `/api/usuarios`:
```json
{ "email": "clara@realizafesta.com", "senha": "SenhaForte123", "nome": "Clara", "papel": "admin" }
{ "email": "marcelo@realizafesta.com", "senha": "SenhaForte123", "nome": "Marcelo", "papel": "operacional" }
```
Ou crie diretamente no Supabase: Authentication → Users → Add User

### 5. Rodar em desenvolvimento
```bash
npm run dev
```

### 6. Deploy na Vercel
- Conecte o repositório no vercel.com
- Configure as mesmas variáveis de ambiente
- Deploy automático a cada push

## PWA (celular)
Acesse o site no celular → menu do navegador → "Adicionar à tela inicial"

## Estrutura
```
src/
  app/
    (app)/          # Páginas protegidas
      page.tsx      # Dashboard
      eventos/      # Gestão de eventos
      clientes/     # Clientes + leads CRM
      estoque/      # Estoque por categoria
      financeiro/   # Dashboard financeiro
      agenda/       # Calendário
    api/            # API Routes (Next.js)
    login/          # Página de login
  components/       # Componentes reutilizáveis
  lib/              # Supabase client, utils
  types/            # TypeScript types
supabase/
  migrations/       # SQL do banco
```
