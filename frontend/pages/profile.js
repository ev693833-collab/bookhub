import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, User, Mail, Lock,
  ShieldCheck, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, Save, X, Camera, Trash2
} from 'lucide-react';
import styles from '../styles/profile.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // Dados do formulário
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    new_password: '',
    confirm_password: '',
  });

  // Função/Permissão (somente leitura - vinda do backend)
  const [userRole, setUserRole] = useState('user');

  // Controle de visibilidade de senha
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Carregar dados frescos do usuário logado
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserData = localStorage.getItem('userData');

    if (!token || !storedUserData) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUserData);
      setForm((prev) => ({
        ...prev,
        full_name: parsed.full_name || '',
        email: parsed.email || '',
        avatar_url: parsed.avatar_url || '',
      }));
      setUserRole(parsed.role || 'user');
    } catch (_) {}

    // Buscar dados mais atualizados do backend
    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            router.push('/login');
            return;
          }
          throw new Error('Falha ao carregar perfil.');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user) {
          setForm((prev) => ({
            ...prev,
            full_name: data.user.full_name || '',
            email: data.user.email || '',
            avatar_url: data.user.avatar_url || '',
          }));
          setUserRole(data.user.role || 'user');
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      })
      .catch((err) => {
        console.warn('Usando dados em cache local do usuário:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleChange = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    router.push('/home');
  };

  // Abrir o seletor de arquivo ao clicar na foto ou botão da câmera
  const handleAvatarClick = () => {
    if (uploadingAvatar || submitting) return;
    fileInputRef.current?.click();
  };

  // Processar e salvar a foto selecionada
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é muito grande (máximo de 15MB).');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setUploadingAvatar(true);

    try {
      // Comprime e redimensiona como quadrado perfeito (400x400) com alta fidelidade
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const size = Math.min(img.width, img.height);
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;

            const canvas = document.createElement('canvas');
            const targetSize = Math.min(size, 400);
            canvas.width = targetSize;
            canvas.height = targetSize;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          };
          img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Falha ao abrir arquivo de imagem.'));
        reader.readAsDataURL(file);
      });

      // 1. Atualizar prévia visual imediatamente
      setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
      setImageError(false);

      // 2. Salvar imediatamente no backend
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar foto de perfil.');
      }

      // 3. Atualizar dados no localStorage e sincronizar aplicação
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }));
      }

      setSuccessMessage('Foto de perfil salva com sucesso!');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao atualizar foto de perfil.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remover foto de perfil e voltar à letra inicial
  const handleRemoveAvatar = async () => {
    if (uploadingAvatar || submitting) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingAvatar(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          avatar_url: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover foto de perfil.');
      }

      setForm((prev) => ({ ...prev, avatar_url: '' }));
      setImageError(false);

      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }));
      }

      setSuccessMessage('Foto removida. Inicial mantida no perfil!');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao remover foto.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validações no frontend
    if (!form.full_name.trim()) {
      setErrorMessage('O nome completo é obrigatório.');
      return;
    }

    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Se preencheu algum campo de senha nova
    if (form.new_password || form.confirm_password) {
      if (form.new_password.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (form.new_password !== form.confirm_password) {
        setErrorMessage('A confirmação da nova senha não confere.');
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        avatar_url: form.avatar_url || null,
      };

      if (form.new_password) {
        payload.new_password = form.new_password;
        payload.confirm_password = form.confirm_password;
      }

      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erro ao atualizar perfil.');
        return;
      }

      // Sucesso! Atualizar sessão local
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUserRole(data.user.role || userRole);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }));
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Se alterou senha e é o admin, memorizar para facilitar no login
      if (form.new_password) {
        localStorage.setItem('last_admin_pass', form.new_password);
      }

      // Limpar campos de senha
      setForm((prev) => ({
        ...prev,
        new_password: '',
        confirm_password: '',
      }));

      setSuccessMessage(data.message || 'Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      setErrorMessage('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = userRole === 'admin';
  const userInitial = form.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <Head>
        <title>Meu Perfil — DevSongs</title>
        <meta name="description" content="Gerenciamento do perfil de usuário no DevSongs" />
        <link rel="icon" href="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025191/bookhub/favicon.png" type="image/png" />
      </Head>

      <div className={styles.profilePage}>
        {/* Barra Superior */}
        <header className={styles.topNav}>
          <Link href="/home" className={styles.brand}>
            <Image
              src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png"
              alt="DevSongs"
              width={34}
              height={34}
              className={styles.brandLogo}
            />
            <span className={styles.brandName}>
              Dev<span className={styles.brandHighlight}>Songs</span>
            </span>
          </Link>

          <Link href="/home" className={styles.backBtn} title="Voltar para a página de músicas">
            <ArrowLeft size={16} />
            <span>Voltar ao Player</span>
          </Link>
        </header>

        {/* Conteúdo Principal */}
        <main className={styles.mainContainer}>
          <div className={styles.profileCard}>
            {/* Hero do Perfil */}
            <div className={styles.profileHero}>
              <div className={styles.avatarContainer}>
                <div
                  className={`${styles.avatarLarge} ${styles.avatarClickable}`}
                  onClick={handleAvatarClick}
                  title="Clique na foto para selecionar e salvar uma nova imagem de perfil"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAvatarClick();
                    }
                  }}
                >
                  {form.avatar_url && !imageError ? (
                    <img
                      src={form.avatar_url}
                      alt={form.full_name || 'Avatar'}
                      className={styles.avatarImg}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>{userInitial}</span>
                  )}

                  {/* Overlay ao passar o mouse */}
                  <div className={styles.avatarHoverOverlay}>
                    <Camera size={19} />
                    <span className={styles.avatarOverlayText}>
                      {uploadingAvatar ? 'Salvando...' : 'Trocar foto'}
                    </span>
                  </div>

                  {/* Spinner durante o envio */}
                  {uploadingAvatar && (
                    <div className={styles.avatarSpinnerOverlay}>
                      <div className={styles.avatarSpinner} />
                    </div>
                  )}
                </div>

                {/* Botão flutuante de câmera */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className={styles.avatarBadgeBtn}
                  title="Clique para trocar a foto de perfil"
                  aria-label="Trocar foto de perfil"
                  disabled={uploadingAvatar}
                >
                  <Camera size={14} />
                </button>

                {/* Input de seleção de foto oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  style={{ display: 'none' }}
                />

                {/* Botão para remover a foto e deixar a letra caso haja foto */}
                {form.avatar_url && !imageError && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className={styles.removeAvatarBtn}
                    disabled={uploadingAvatar}
                    title="Remover foto e manter apenas a letra inicial"
                  >
                    <Trash2 size={12} />
                    <span>Remover foto</span>
                  </button>
                )}
              </div>

              <div className={styles.heroDetails}>
                <h1 className={styles.heroName}>{form.full_name || 'Meu Perfil'}</h1>
                <span className={styles.heroEmail}>{form.email || 'carregando...'}</span>

                {isSuperAdmin ? (
                  <div className={styles.roleBadgeSuperAdmin} title="Usuário com permissões totais de administração">
                    <ShieldCheck size={14} />
                    <span>Superadmin</span>
                  </div>
                ) : (
                  <div className={styles.roleBadgeUser} title="Conta com acesso aos recursos de usuário">
                    <Shield size={14} />
                    <span>Usuário Padrão</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alertas */}
            {successMessage && (
              <div className={styles.alertSuccess} role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className={styles.alertError} role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} noValidate>
              {/* SEÇÃO 1: Dados Pessoais */}
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>
                  <User size={18} />
                  <span>Informações Básicas</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Atualize suas informações pessoais e a foto de exibição no DevSongs.
                </p>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="full_name" className={styles.label}>
                      Nome Completo *
                    </label>
                    <div className={styles.inputWrapper}>
                      <User size={16} className={styles.inputIcon} />
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        className={styles.input}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Endereço de E-mail *
                    </label>
                    <div className={styles.inputWrapper}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="seu.email@exemplo.com"
                        className={styles.input}
                        disabled={submitting}
                      />
                    </div>
                    <span className={styles.inputHelp}>
                      O e-mail é único no sistema e não pode ser compartilhado por outras contas.
                    </span>
                  </div>



                  {/* Nível de Acesso (Informativo e protegido contra alteração) */}
                  <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                    <label className={styles.label}>Nível de Permissão</label>
                    <div className={styles.inputWrapper}>
                      <Shield size={16} className={styles.inputIcon} />
                      <input
                        type="text"
                        disabled
                        value={isSuperAdmin ? 'Superadmin (Acesso total)' : 'Usuário Padrão'}
                        className={`${styles.input} ${styles.inputDisabled}`}
                      />
                    </div>
                    <span className={styles.inputHelp}>
                      O nível de acesso é concedido pela administração e não pode ser alterado pelo usuário.
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              {/* SEÇÃO 2: Segurança & Senha */}
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>
                  <Lock size={18} />
                  <span>Segurança & Alteração de Senha</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Preencha os campos abaixo apenas se desejar modificar sua senha de acesso.
                </p>

                <div className={styles.formGrid}>


                  <div className={styles.formGroup}>
                    <label htmlFor="new_password" className={styles.label}>
                      Nova Senha
                    </label>
                    <div className={styles.inputWrapper}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input
                        id="new_password"
                        name="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={form.new_password}
                        onChange={handleChange}
                        placeholder="Mínimo de 6 caracteres"
                        className={styles.input}
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={styles.eyeBtn}
                        tabIndex={-1}
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirm_password" className={styles.label}>
                      Confirmar Nova Senha
                    </label>
                    <div className={styles.inputWrapper}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirm_password}
                        onChange={handleChange}
                        placeholder="Repita a nova senha"
                        className={styles.input}
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={styles.eyeBtn}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className={styles.actionFooter}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={submitting}
                >
                  <Save size={16} />
                  <span>{submitting ? 'Salvando...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
