// src/services/api.js
import axios from 'axios';

// Cria a instância do Axios com configurações padrão
export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para tratar erros vindos do backend de forma amigável
api.interceptors.response.use(
  (response) => response.data, // Já retorna o corpo da resposta limpo (sem precisar de .data em todo arquivo)
  (error) => {
    // Captura a mensagem de erro customizada enviada pela nossa API na Vercel (ex: erro 409 de colisão)
    const apiErrorMessage = error.response?.data?.error || 'Ocorreu um erro na requisição.';
    return Promise.reject(new Error(apiErrorMessage));
  }
);
