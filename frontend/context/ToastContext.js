import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const ToastContext = createContext({
  toast: { show: false, isClosing: false, type: 'success', userName: '', message: '', duration: 1000 },
  showLoginToast: () => {},
  showErrorToast: () => {},
  closeToast: () => {},
});

export function ToastProvider({ children }) {
  const router = useRouter();

  const [toast, setToast] = useState({
    show: false,
    isClosing: false,
    type: 'success', // 'success' | 'error'
    userName: '',
    message: '',
    duration: 1000,
  });

  const autoCloseTimerRef = useRef(null);
  const closingAnimationTimerRef = useRef(null);

  // Limpa todos os temporizadores pendentes
  const clearAllTimers = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (closingAnimationTimerRef.current) {
      clearTimeout(closingAnimationTimerRef.current);
      closingAnimationTimerRef.current = null;
    }
  }, []);

  // Fechamento manual ou automático com transição de saída suave
  const closeToast = useCallback(() => {
    clearAllTimers();

    // Inicia a animação de fade-out / slide-out
    setToast((prev) => {
      if (!prev.show) return prev;
      return { ...prev, isClosing: true };
    });

    // Remove do DOM após o término da animação de saída (250ms)
    closingAnimationTimerRef.current = setTimeout(() => {
      setToast({
        show: false,
        isClosing: false,
        type: 'success',
        userName: '',
        message: '',
        duration: 1000,
      });
    }, 250);
  }, [clearAllTimers]);

  // Garante que o toast seja fechado imediatamente caso ocorra troca de rota
  useEffect(() => {
    const handleRouteChange = () => {
      clearAllTimers();
      setToast({
        show: false,
        isClosing: false,
        type: 'success',
        userName: '',
        message: '',
        duration: 1000,
      });
    };

    router.events?.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router, clearAllTimers]);

  // Dispara a exibição do toast de login bem-sucedido
  const showLoginToast = useCallback(
    (rawName, customDuration = 2000) => {
      clearAllTimers();

      // Formata o nome do usuário com inteligência
      let cleanName = '';
      if (rawName && typeof rawName === 'string') {
        const trimmed = rawName.trim();
        if (
          trimmed.toLowerCase().includes('super') ||
          trimmed.toLowerCase().includes('admin')
        ) {
          cleanName = 'Superadmin';
        } else {
          const first = trimmed.split(/\s+/)[0];
          if (first) {
            cleanName = first.charAt(0).toUpperCase() + first.slice(1);
          }
        }
      }

      const duration = Number(customDuration) || 2000;

      setToast({
        show: true,
        isClosing: false,
        type: 'success',
        userName: cleanName,
        message: '',
        duration,
      });

      autoCloseTimerRef.current = setTimeout(() => {
        closeToast();
      }, duration);
    },
    [clearAllTimers, closeToast]
  );

  // Dispara a exibição do toast de erro (credenciais inválidas, campos vazios, etc.)
  const showErrorToast = useCallback(
    (message = 'E-mail ou senha inválidos.', customDuration = 4000) => {
      clearAllTimers();

      const duration = Number(customDuration) || 4000;

      setToast({
        show: true,
        isClosing: false,
        type: 'error',
        userName: '',
        message: message || 'E-mail ou senha inválidos.',
        duration,
      });

      autoCloseTimerRef.current = setTimeout(() => {
        closeToast();
      }, duration);
    },
    [clearAllTimers, closeToast]
  );

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return (
    <ToastContext.Provider value={{ toast, showLoginToast, showErrorToast, closeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
}
