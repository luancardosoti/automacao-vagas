# Automação de Vagas — envio de mensagens via WhatsApp

Projeto simples para automatizar o disparo de mensagens de candidatura a vagas
via WhatsApp: você cria templates com `[nome]`, escolhe o contato e o template,
e o backend dispara a mensagem.

## Stack

- **Backend:** Fastify + Prisma + SQLite + `zapo-js` (conexão com WhatsApp Web)
- **Frontend:** React + Vite + Tailwind + componentes estilo shadcn/ui

## Estrutura

```
automacao-vagas/
  backend/   # API Fastify
  frontend/  # SPA React
```

## Como rodar

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate   # cria o banco SQLite e as tabelas
npm run dev               # http://localhost:3333
```

Na primeira execução, acesse a aba **Conexão WhatsApp** no frontend e clique em
"Conectar" — vai aparecer um QR Code para escanear no app do WhatsApp do
celular. A sessão fica salva em `backend/.auth/state.sqlite`, então não
precisa escanear de novo nas próximas vezes (a menos que desconecte o
aparelho).

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

O Vite já está configurado para redirecionar chamadas `/api/*` para o backend
em `localhost:3333` (veja `vite.config.ts`).

## Fluxo de uso

1. **Templates:** crie uma mensagem com `[nome]` no lugar do nome da pessoa.
   Ex: `Olá [nome], vi sua vaga de dev e gostaria de me candidatar...`
2. **Conexão WhatsApp:** conecte escaneando o QR Code uma vez.
3. **Enviar:** escolha o template, selecione um contato já cadastrado ou
   preencha nome + telefone de um novo, confira a pré-visualização da
   mensagem e envie. Todo envio fica registrado no histórico (enviado/falhou).

## Sobre o `zapo-js`

O backend usa o pacote npm **`zapo-js`** (https://zapo.to), uma implementação
TypeScript do protocolo do WhatsApp Web, com armazenamento de sessão em
SQLite via `@zapo-js/store-sqlite`. A integração está em
`backend/src/services/whatsapp.service.ts`.

⚠️ **Atenção:** essa biblioteca está em desenvolvimento ativo (lança novas
versões com frequência) e a API pode mudar entre versões menores. O código
aqui segue o "Quick Start" oficial da documentação (eventos `auth_qr`,
`auth_paired`, `disconnected`, e `client.message.send(jid, texto)`). Antes de
rodar em produção, vale a pena conferir a versão instalada contra a
documentação atual em zapo.to e ajustar nomes de evento/método se algo tiver
mudado. Se no backend do Everardo vocês já têm um wrapper pronto para o
zapo-js, pode valer mais a pena reaproveitar aquele service em vez deste.

## Próximos passos possíveis (não implementados ainda)

- Reenvio/agendamento de mensagens
- Importação de contatos em massa (CSV)
- Suporte a variáveis além de `[nome]` no template (ex: `[vaga]`, `[empresa]`)
- Autenticação na própria aplicação (hoje não há login)
