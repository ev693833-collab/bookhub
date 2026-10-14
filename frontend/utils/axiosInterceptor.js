import axios from 'axios';

let interceptorsConfigured = false;

export default function setupAxiosInterceptors() {
  if (typeof window === 'undefined' || interceptorsConfigured) return;

  // Interceptor de Requisição: Adiciona o token JWT no cabeçalho Authorization se disponível
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de Resposta: Trata erros globais de autenticação (ex: 401 Unauthorized)
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
      return Promise.reject(error);
    }
  );

  interceptorsConfigured = true;
}
