import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from '../styles/auth.module.css';
import BackgroundVideo from '../components/BackgroundVideo';
import { useToast } from '../context/ToastContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Login() {
  const router = useRouter();
  const { showLoginToast, showErrorToast, closeToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Preenche dados ao ser redirecionado após o cadastro
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.registered) {
      setSuccessMessage('Conta criada com sucesso! Digite sua senha para entrar.');
    }
    if (router.query.email) {
      setForm(prev => ({ ...prev, email: String(router.query.email) }));
    }
  }, [router.isReady, router.query]);

  const handleChange = (e) => {
    setError('');
    setSuccessMessage('');
    closeToast();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    closeToast();

    if (!form.email.trim() || !form.password) {
      const msg = 'Preencha todos os campos.';
      setError(msg);
      showErrorToast(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'E-mail ou senha inválidos.';
        setError(errorMsg);
        showErrorToast(errorMsg);
        setLoading(false);
        return;
      }

      // Salva token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Dispara toast personalizado com o nome dinâmico na tela de login (2 segundos)
      const userName = data.user?.full_name || data.user?.name || '';
      const displayDuration = 2000;
      showLoginToast(userName, displayDuration);

      // Aguarda 2 segundos na tela de login para que o usuário veja a confirmação com calma
      setTimeout(() => {
        closeToast();
        router.push('/home');
      }, displayDuration);
    } catch (err) {
      const connMsg = 'Erro de conexão. Verifique se o servidor está ativo.';
      setError(connMsg);
      showErrorToast(connMsg);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Entrar — DevSongs</title>
        <meta name="description" content="Entre na sua conta DevSongs e aproveite músicas curadas para desenvolvedores." />
        <link rel="icon" href="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025191/bookhub/favicon.png" type="image/png" />
      </Head>

      <div className={styles.authPage}>
        <BackgroundVideo />
        <div className={styles.gridBg} />

        <div className={styles.authWrapper}>

          {/* Back to home */}
          <Link href="/" className={styles.backHome}>
            <ArrowLeft size={14} />
            Voltar ao início
          </Link>

          {/* Brand */}
          <Link href="/" className={styles.brand}>
            <Image
              src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png"
              alt="DevSongs"
              width={36}
              height={36}
              className={styles.brandLogo}
            />
            <span className={styles.brandName}>
              Dev<span className={styles.brandHighlight}>Songs</span>
            </span>
          </Link>

          {/* Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Bem-vindo de volta 👋</h1>
              <p className={styles.cardSubtitle}>
                Entre na sua conta para continuar ouvindo
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {/* Success from register */}
              {successMessage && (
                <div className={styles.alertSuccess} role="status">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className={styles.alertError} role="alert">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* E-mail */}
              <div className={styles.inputGroup}>
                <label htmlFor="login-email" className={styles.inputLabel}>E-mail</label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className={styles.inputGroup}>
                <label htmlFor="login-password" className={styles.inputLabel}>Senha</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Esqueci senha */}
              <div className={styles.forgotRow}>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Esqueceu a senha?
                </Link>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading && <span className={styles.btnSpinner} />}
                {loading ? 'Entrando...' : 'Entrar na conta'}
              </button>

              {/* Acesso Rápido Superadmin */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    closeToast();
                    const savedAdminPass = typeof window !== 'undefined' ? localStorage.getItem('last_admin_pass') : null;
                    setForm({ email: 'admin@bookhub.com', password: savedAdminPass || 'admin123' });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  👑 Preencher Dados do Superadmin
                </button>
              </div>

            </form>
          </div>

          {/* Switch */}
          <p className={styles.switchText}>
            Não tem uma conta?{' '}
            <Link href="/register" className={styles.switchLink}>
              Cadastre-se grátis
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}
