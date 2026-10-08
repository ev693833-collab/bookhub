import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Settings, MessageCircle, User, Shield, Building2 } from 'lucide-react';
import Image from 'next/image';
import styles from './Header.module.css';
import EditProfileModal from './EditProfileModal';
import ThemeToggle from './ThemeToggle';

// Hook personalizado para detectar o tema atual
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Função para verificar o tema atual
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDark(isDarkMode);
    };

    // Verificar tema inicial
    checkTheme();

    // Listener para mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    // Listener para mudanças no localStorage
    const handleStorageChange = () => checkTheme();
    window.addEventListener('storage', handleStorageChange);

    // Listener para mudanças no atributo data-theme (mudanças via toggle)
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsDark(currentTheme === 'dark');
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      mediaQuery.removeEventListener('change', checkTheme);
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  return isDark;
};

export default function Header({ auth }) {
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const isDark = useTheme();

  useEffect(() => {
    // Buscar nome da empresa do userData
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.companyName) setCompanyName(userData.companyName);
    } catch { }
  }, []);


  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.userAvatar') && !event.target.closest('.dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  function handleLogout() {
    console.log('Logout executado');

    // Fechar dropdown
    setShowUserDropdown(false);

    // Remover todos os dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('chatbotHistory');

    console.log('LocalStorage limpo, redirecionando para login');


    // Redirecionar para login
    router.push("/login");
  }



  const handleChangeCompany = () => {
    console.log('Trocar empresa executado');

    // Fechar dropdown
    setShowUserDropdown(false);

    // Remover dados da empresa dentro de userData
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed.companyId;
        delete parsed.companyName;
        delete parsed.userRole;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
    } catch { }


    console.log('Dados da empresa removidos, redirecionando para seleção');

    // Limpar estado local da empresa
    setCompanyName('');

    // Redirecionar para seleção de empresa
    router.push('/select-company');
  };

  const handleNavigateToChat = () => {
    router.push('/chat');
  };

  const handleNavigateToSettings = () => {
    router.push('/ajustes');
  };

  const handleNavigateToSuperadmin = () => {
    router.push('/superadmin');
  };

  const handleNavigateToAdmin = () => {
    router.push('/admin');
  };

  // Função para verificar se uma aba está ativa
  const isActiveTab = (path) => {
    return router.pathname === path;
  };

  const handleEditProfile = () => {
    setShowUserDropdown(false);
    setShowEditProfileModal(true);
  };

  const handleProfileUpdateSuccess = (updatedUser) => {
    // Atualizar o contexto de autenticação se necessário
    if (auth && auth.setUser) {
      auth.setUser(updatedUser);
    }
    // Recarregar a página para atualizar os dados do usuário
    window.location.reload();
  };

  // Verificar se auth e user estão disponíveis
  if (!auth || !auth.user) {
    return null;
  }

  const { user } = auth;
  const isSuperadmin = user?.role === 'Superadmin' || user?.userRole === 'Superadmin';
  const isAdmin = user?.role === 'Administrador' || user?.userRole === 'Administrador';

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo e Navegação */}
          <div className={styles.leftSection}>
            <div className={styles.logo}>
              <Image
                src={isDark ? "/img/logo-aura8-branca.png" : "/img/logo-aura8.png"}
                alt="Aura8"
                width={140}
                height={32}
                className={styles.logoImage}
                priority
              />
            </div>

            {/* Navegação */}
            <div className={styles.navigation}>
              <button
                className={`${styles.navButton} ${isActiveTab('/chat') ? styles.navButtonActive : ''}`}
                onClick={handleNavigateToChat}
                title="Atendimentos"
              >
                <MessageCircle size={20} />
                <span>Atendimentos</span>
              </button>

              <button
                className={`${styles.navButton} ${isActiveTab('/ajustes') ? styles.navButtonActive : ''}`}
                onClick={handleNavigateToSettings}
                title="Ajustes"
              >
                <Settings size={20} />
                <span>Ajustes</span>
              </button>

              {isAdmin && (
                <button
                  className={`${styles.navButton} ${isActiveTab('/admin') ? styles.navButtonActive : ''}`}
                  onClick={handleNavigateToAdmin}
                  title="Admin"
                >
                  <Building2 size={20} />
                  <span>Admin</span>
                </button>
              )}

              {isSuperadmin && (
                <button
                  className={`${styles.navButton} ${isActiveTab('/superadmin') ? styles.navButtonActive : ''}`}
                  onClick={handleNavigateToSuperadmin}
                  title="Superadmin"
                >
                  <Shield size={20} />
                  <span>Superadmin</span>
                </button>
              )}
            </div>
          </div>

          {/* Usuário e Dropdown */}
          <div className={styles.userSection}>
            {/* Toggle de Tema */}
            <ThemeToggle />

            <div className={styles.userInfo}>

              <div className={`${styles.userAvatar} userAvatar`} onClick={() => setShowUserDropdown(!showUserDropdown)}>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{user.nome || user.name}</span>
                  {companyName && (
                    <span className={styles.companyName}>{companyName}</span>
                  )}
                </div>
                <svg className={styles.dropdownArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Dropdown */}
            {showUserDropdown && (
              <div className={`${styles.dropdown} dropdown`}>
                <div className={styles.dropdownItem} onClick={handleEditProfile}>
                  <User className={styles.dropdownIcon} size={16} />
                  Editar Perfil
                </div>
                <div className={styles.dropdownItem} onClick={handleChangeCompany}>
                  <svg className={styles.dropdownIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Trocar de Empresa
                </div>
                <div className={styles.dropdownItem} onClick={handleLogout}>
                  <svg className={styles.dropdownIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Edição de Perfil */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSuccess={handleProfileUpdateSuccess}
      />
    </>
  );
}
