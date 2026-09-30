# Cadastro de Usuários

## Configuração do servidor

Defina `MONGODB_URI` e `JWT_SECRET` no ambiente local e nas variáveis de ambiente da Vercel. Gere um segredo forte e único para cada ambiente; não use o valor de exemplo nem versione segredos reais. Tokens de acesso expiram após oito horas.

No desenvolvimento local, execute `npm run dev:local` para iniciar Vite e API juntos. O servidor da API carrega as variáveis de `.env.local` e escuta na porta `5005`, usada pelo proxy do Vite. O comando encerra os dois processos se um deles parar.

Cadastros e agendamentos públicos continuam sem autenticação. Operações administrativas e de conta do cliente exigem um token válido. Contas existentes com senha SHA-256 migram para bcrypt automaticamente após o próximo login bem-sucedido.

Execute `npm test` para os testes do middleware de autenticação.

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
