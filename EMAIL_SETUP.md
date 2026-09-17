# Configurar envio de e-mail

A aba **Emails** envia candidaturas por e-mail (template + currículo anexado
em PDF ou qualquer outro arquivo) usando o **Gmail via SMTP** por padrão.

## Passo a passo (Gmail)

1. **Ative a verificação em duas etapas** na sua conta Google, se ainda não
   tiver: https://myaccount.google.com/security → "Verificação em duas
   etapas". É obrigatório pra conseguir gerar uma senha de app no próximo
   passo (o Google não permite mais logar com a senha normal em apps de
   terceiros).

2. **Gere uma senha de app**: https://myaccount.google.com/apppasswords
   - Nome do app: pode ser qualquer coisa, ex. "Automação de Vagas".
   - O Google vai mostrar uma senha de 16 letras (ex: `abcd efgh ijkl mnop`).
     Copie ela — não vai aparecer de novo depois.
   - **Não é a senha da sua conta Google.** É uma senha só pra esse app, e dá
     pra revogar a qualquer momento na mesma página sem afetar sua conta.

3. **Configure o `backend/.env`** (se ele ainda não existir, rode `npm
   install` na raiz do projeto uma vez — o setup automático já cria esse
   arquivo a partir do `.env.example`):

   ```bash
   EMAIL_PROVIDER=gmail
   GMAIL_USER=seu-email@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop   # a senha de 16 letras, sem espaços
   EMAIL_FROM_NAME="Automação de Vagas"   # nome que aparece como remetente
   ```

4. **Reinicie o backend** (`npm run dev` na raiz, ou só `npm run dev -w
   backend`) pra carregar as variáveis novas.

5. Na aba **Emails** do app, preencha nome, e-mail do destinatário, assunto,
   escolha um template (os mesmos cadastrados na aba Templates) e, se quiser,
   anexe um documento já cadastrado na aba Documentos. Clique em "Enviar
   e-mail".

Se faltar `GMAIL_USER`/`GMAIL_APP_PASSWORD`, o envio falha com uma mensagem
clara e fica registrado no histórico com status "falhou" — não precisa ficar
adivinhando o que deu errado.

## Limites do Gmail

Contas Gmail comuns aguentam ~500 e-mails/dia (Google Workspace tem limites
maiores). Pra volume de candidatura de vaga isso é bem folgado. Se algum dia
precisar de mais volume ou preferir não usar a conta pessoal, dá pra trocar
de provedor sem tocar no resto do app — veja a seção abaixo.

## Trocando de provedor (ex: Resend, Brevo, SES...)

O backend nunca fala diretamente com o Gmail fora de um lugar só. A interface
está em `backend/src/services/email/types.ts`:

```ts
export interface EmailService {
  send(message: EmailMessage): Promise<void>
}
```

Pra adicionar um provedor novo:

1. Crie `backend/src/services/email/<provedor>.service.ts` implementando
   `EmailService` (use `gmail-smtp.service.ts` como referência — geralmente é
   só instalar o SDK do provedor e chamar o método de envio dele dentro de
   `send()`).
2. Em `backend/src/services/email/index.ts`, adicione um `case` novo na
   função `criarEmailService()` apontando pra essa classe, lendo as
   variáveis de ambiente que o provedor precisar (API key, etc.).
3. No `.env`, mude `EMAIL_PROVIDER` pro nome do novo `case` (ex:
   `EMAIL_PROVIDER=resend`) e configure as variáveis do provedor.

Nenhuma rota (`emails.routes.ts`) ou tela do frontend precisa mudar — todas
dependem só da interface `EmailService`, nunca de um provedor específico.
