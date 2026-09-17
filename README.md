# Automação de Vagas — envio de mensagens via WhatsApp

Projeto simples para automatizar o disparo de mensagens de candidatura a vagas
via WhatsApp: você cria templates com `[nome]`, escolhe o contato e o template,
e o backend dispara a mensagem.

## Stack

- **Backend:** Fastify + Prisma + SQLite + `zapo-js` (conexão com WhatsApp Web)
- **Frontend:** React + Vite + Tailwind + componentes estilo shadcn/ui

## Estrutura

Monorepo com [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces):

```
automacao-vagas/
  backend/   # API Fastify
  frontend/  # SPA React
  scripts/   # setup automático (postinstall)
```

## Como rodar

Um único `npm install` na raiz instala as dependências do backend e do
frontend e já deixa tudo pronto (cria `backend/.env` a partir do
`.env.example` se não existir, gera o client do Prisma e aplica as
migrations):

```bash
npm install
npm run dev   # backend em :3333 e frontend em :5173, juntos
```

O Vite já está configurado para redirecionar chamadas `/api/*` para o backend
em `localhost:3333` (veja `frontend/vite.config.ts`).

Na primeira execução, acesse a aba **Conexão WhatsApp** no frontend e clique em
"Conectar" — vai aparecer um QR Code para escanear no app do WhatsApp do
celular. A sessão fica salva em `backend/.auth/state.sqlite`, então não
precisa escanear de novo nas próximas vezes (a menos que desconecte o
aparelho).

Se preferir rodar cada lado separadamente: `npm run dev -w backend` e
`npm run dev -w frontend`.

## Fluxo de uso

1. **Templates:** crie uma mensagem com `[nome]` no lugar do nome da pessoa.
   Ex: `Olá [nome], vi sua vaga de dev e gostaria de me candidatar...`
2. **Documentos:** suba arquivos (ex: currículo em PDF) que podem ser
   enviados dentro de um fluxo.
3. **Fluxos:** monte uma sequência de etapas — template, documento ou
   mensagem livre (sem template) — para disparar em ordem para um contato.
   Ex: mensagem de apresentação seguida do currículo em PDF.
4. **Conexão WhatsApp:** conecte escaneando o QR Code uma vez.
5. **Enviar:** escolha o template, selecione um contato já cadastrado ou
   preencha nome + telefone de um novo, confira a pré-visualização da
   mensagem e envie. Todo envio (e todo disparo de fluxo) fica registrado no
   histórico correspondente.

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
