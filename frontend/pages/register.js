import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from '../styles/auth.module.css';
import BackgroundVideo from '../components/BackgroundVideo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ── Helpers ── */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 25,  label: 'Fraca',   color: '#ef4444' };
  if (score === 2) return { score: 50,  label: 'Razoável', color: '#f59e0b' };
  if (score === 3) return { score: 75,  label: 'Boa',      color: '#3b82f6' };
  return              { score: 100, label: 'Forte',    color: '#10b981' };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Component ── */
export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms]       = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const [success, setSuccess]                   = useState('');

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!form.full_name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!acceptedTerms) {
      setError('Você precisa aceitar os Termos de Uso.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta. Tente novamente.');
        return;
      }

      // Redireciona imediatamente para a tela de login
      router.push(`/login?registered=true&email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } catch (err) {
      setError('Erro de conexão. Verifique se o servidor está ativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Criar conta — DevSongs</title>
        <meta name="description" content="Crie sua conta gratuita no DevSongs e descubra músicas para desenvolvedores." />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>

      <div className={styles.authPage}>
        <BackgroundVideo />
        <div className={styles.gridBg} />

        <div className={styles.authWrapper}>

          {/* Back */}
          <Link href="/" className={styles.backHome}>
            <ArrowLeft size={14} />
            Voltar ao início
          </Link>

          {/* Brand */}
          <Link href="/" className={styles.brand}>
            <Image
              src="/img/logo-devsongs.png"
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
              <h1 className={styles.cardTitle}>Crie sua conta grátis 🎵</h1>
              <p className={styles.cardSubtitle}>
                Junte-se ao DevSongs e explore músicas incríveis
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {/* Alert: error */}
              {error && (
                <div className={styles.alertError} role="alert">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Alert: success */}
              {success && (
                <div className={styles.alertSuccess} role="status">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{success}</span>
                </div>
              )}

              {/* Nome */}
              <div className={styles.inputGroup}>
                <label htmlFor="reg-name" className={styles.inputLabel}>Nome completo</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    id="reg-name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={form.full_name}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className={styles.inputGroup}>
                <label htmlFor="reg-email" className={styles.inputLabel}>E-mail</label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="reg-email"
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
                <label htmlFor="reg-password" className={styles.inputLabel}>Senha</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
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

                {/* Strength bar */}
                {form.password && (
                  <>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{ width: `${strength.score}%`, background: strength.color }}
                      />
                    </div>
                    <span className={styles.strengthLabel} style={{ color: strength.color }}>
                      Força da senha: {strength.label}
                    </span>
                  </>
                )}
              </div>

              {/* Confirmar senha */}
              <div className={styles.inputGroup}>
                <label htmlFor="reg-confirm" className={styles.inputLabel}>Confirmar senha</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className={styles.checkboxRow}>
                <input
                  id="reg-terms"
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={acceptedTerms}
                  onChange={(e) => { setError(''); setAcceptedTerms(e.target.checked); }}
                  disabled={loading}
                />
                <label htmlFor="reg-terms" className={styles.checkboxLabel}>
                  Concordo com os{' '}
                  <a href="#" className={styles.checkboxLink}>Termos de Uso</a>
                  {' '}e a{' '}
                  <a href="#" className={styles.checkboxLink}>Política de Privacidade</a>
                  {' '}do DevSongs
                </label>
              </div>

              {/* Submit */}
              <button
                id="register-submit-btn"
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading && <span className={styles.btnSpinner} />}
                {loading ? 'Criando conta...' : 'Criar conta grátis'}
              </button>

            </form>
          </div>

          {/* Switch */}
          <p className={styles.switchText}>
            Já tem uma conta?{' '}
            <Link href="/login" className={styles.switchLink}>
              Entrar agora
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}
