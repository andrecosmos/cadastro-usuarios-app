# Cadastro de Usuários

## Configuração do servidor

Defina `MONGODB_URI` e `JWT_SECRET` no ambiente local e nas variáveis de ambiente da Vercel. Gere um segredo forte e único para cada ambiente; não use o valor de exemplo nem versione segredos reais. Tokens de acesso expiram após oito horas.

No desenvolvimento local, execute `npm run dev:local` para iniciar Vite e API juntos. O servidor da API carrega as variáveis de `.env.local` e escuta na porta `5005`, usada pelo proxy do Vite. O comando encerra os dois processos se um deles parar.

Cadastros e agendamentos públicos continuam sem autenticação. Operações administrativas e de conta do cliente exigem um token válido. Contas existentes com senha SHA-256 migram para bcrypt automaticamente após o próximo login bem-sucedido.

Execute `npm test` para os testes do middleware de autenticação.

## Checkout do Mercado Pago

Cada empresa deve cadastrar o token de acesso da própria conta Mercado Pago em **Configurações** no painel administrativo. O token é mantido apenas no servidor e nunca é retornado pela API pública.

Configure `PUBLIC_APP_URL` no ambiente da API com apenas a origem pública HTTPS da aplicação (por exemplo, `https://agenda.example.com`, sem caminho). Na Vercel, `VERCEL_URL` é usado como alternativa. O Mercado Pago envia as notificações para `/api/webhooks/mercado-pago`; em desenvolvimento local, exponha a porta `3000` por um túnel HTTPS e use a URL do túnel em `PUBLIC_APP_URL` para que ele alcance o Vite e o proxy da API. Depois de alterar `.env.local`, reinicie a API.

Agendamentos feitos por clientes são confirmados independentemente do pagamento. Quando o estabelecimento configurou o Mercado Pago e a aplicação tem uma URL pública HTTPS, o cliente pode pagar pelo checkout durante o agendamento ou mais tarde pela Minha Conta. Também pode pagar diretamente no estabelecimento. A aprovação do checkout atualiza o status de pagamento sem alterar a confirmação do horário. Agendamentos administrativos continuam sem iniciar checkout.

No painel administrativo, a aba **Relatórios** exibe contagens de agendamentos por status e faturamento recebido no período selecionado. O faturamento considera somente pagamentos registrados: aprovações do Mercado Pago ou pagamentos presenciais registrados no cartão do agendamento com método Pix, dinheiro ou cartão. O registro presencial usa o valor do serviço salvo no agendamento e grava a data/hora de recebimento.

## Interface

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
