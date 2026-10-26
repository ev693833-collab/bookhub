import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import styles from './LoginToast.module.css';

export default function LoginToast() {
  const { toast, closeToast } = useToast();

  if (!toast.show) return null;

  const isError = toast.type === 'error';

  const displaySuccessTitle = toast.userName
    ? `Bem-vindo de volta, ${toast.userName}!`
    : 'Bem-vindo de volta!';

  return (
    <div className={styles.toastContainer} aria-live="polite" role="status">
      <div
        key={`${toast.type}-${toast.userName || toast.message}`}
        className={`${styles.toastCard} ${
          isError ? styles.toastCardError : ''
        } ${toast.isClosing ? styles.toastCardClosing : ''}`}
      >
        {/* Ícone destacado: Check azul para sucesso, AlertCircle vermelho para erro */}
        <div
          className={`${styles.iconBadge} ${
            isError ? styles.iconBadgeError : ''
          }`}
        >
          {isError ? (
            <AlertCircle size={20} color="#ffffff" strokeWidth={2.4} />
          ) : (
            <Check size={20} color="#ffffff" strokeWidth={2.8} />
          )}
        </div>

        {/* Textos da notificação */}
        <div className={styles.textWrap}>
          {isError ? (
            <span className={styles.titleSingle}>
              {toast.message || 'E-mail ou senha inválidos.'}
            </span>
          ) : (
            <>
              <span className={styles.title}>{displaySuccessTitle}</span>
              <span className={styles.subtitle}>Login realizado com sucesso.</span>
            </>
          )}
        </div>

        {/* Botão de fechar (×) */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closeToast}
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>

        {/* Barra de progresso animada */}
        <div className={styles.progressTrack}>
          <div
            key={`progress-${toast.type}-${toast.duration}`}
            className={`${styles.progressBar} ${
              isError ? styles.progressBarError : ''
            }`}
            style={{
              animationDuration: `${
                toast.duration || (isError ? 4000 : 2000)
              }ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
