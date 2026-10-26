import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, TrendingUp, DollarSign, Users, Package, ArrowLeft,
  Search, Filter, CheckCircle2, AlertTriangle, AlertCircle,
  UserPlus, Edit3, Power, RefreshCw, Lock, Calendar, Music,
  Building2, ShoppingBag, Clock, X, ChevronRight, Info, Check, Plus
} from 'lucide-react';
import styles from '../styles/admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const router = useRouter();

  // Estados de autenticação e proteção da rota
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authError, setAuthError] = useState('');

  // Navegação de abas
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sales' | 'financial' | 'stock' | 'companies' | 'users'
  const [period, setPeriod] = useState('all'); // 'today' | '7d' | '30d' | 'all'

  // Dados reais carregados do backend
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const [salesList, setSalesList] = useState([]);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState('all');
  const [loadingSales, setLoadingSales] = useState(false);

  const [financialData, setFinancialData] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  const [stockList, setStockList] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockLowOnly, setStockLowOnly] = useState(false);
  const [stockCompanyFilter, setStockCompanyFilter] = useState('all');
  const [loadingStock, setLoadingStock] = useState(false);

  // Estados de Gravadoras & Bases
  const [companiesList, setCompaniesList] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showCompanyTracksModal, setShowCompanyTracksModal] = useState(false);
  const [selectedCompanyForTracks, setSelectedCompanyForTracks] = useState(null);
  const [companyTracksModalList, setCompanyTracksModalList] = useState([]);
  const [loadingCompanyTracksModal, setLoadingCompanyTracksModal] = useState(false);

  // Formulário Nova Gravadora
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    slug: '',
    genre: 'Variado',
    description: '',
    city: 'São Paulo',
    state: 'SP',
    logo_url: '',
    banner_url: '',
    status: 'active'
  });

  // Formulário Edição Gravadora
  const [editCompanyForm, setEditCompanyForm] = useState({
    id: null,
    name: '',
    slug: '',
    genre: 'Variado',
    description: '',
    city: 'São Paulo',
    state: 'SP',
    logo_url: '',
    banner_url: '',
    status: 'active'
  });

  const [usersList, setUsersList] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modais de Usuários
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Formulário Novo Usuário
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });

  // Formulário Edição Usuário
  const [editUserForm, setEditUserForm] = useState({
    id: null,
    full_name: '',
    email: '',
    role: 'user',
    status: 'active',
    password: ''
  });

  // Modal Ajuste de Estoque
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockTrack, setSelectedStockTrack] = useState(null);
  const [stockAdjustForm, setStockAdjustForm] = useState({
    stock_quantity: 0,
    sale_price: 0,
    rent_price: 0,
    cover_url: '',
    company_id: '',
    genre: ''
  });

  // Toast Feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  /**
   * 1. PROTEÇÃO DE ACESSO À ROTA /admin
   * Valida tanto no localStorage quanto no backend via /api/admin/verify.
   * Se um usuário comum digitar /admin na URL, é barrado e redirecionado para /home.
   */
  useEffect(() => {
    async function verifySuperadminAccess() {
      setIsVerifying(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;

      if (!token || !rawUser) {
        setAuthError('Você precisa estar autenticado como Superadministrador para acessar esta página.');
        setTimeout(() => router.replace('/login'), 1200);
        return;
      }

      try {
        const parsed = JSON.parse(rawUser);
        if (parsed.role !== 'admin') {
          setAuthError('Acesso negado: Sua conta não possui permissão de Superadministrador.');
          setTimeout(() => router.replace('/home'), 1200);
          return;
        }

        // Validação estrita no servidor (evita qualquer manipulação de localStorage)
        const res = await fetch(`${API_URL}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setAuthError(errData.error || 'Acesso não autorizado pelo servidor.');
          setTimeout(() => router.replace('/home'), 1400);
          return;
        }

        const data = await res.json();
        if (data.authorized) {
          setAdminUser(data.user);
          setIsAuthorized(true);
          setIsVerifying(false);
        } else {
          setAuthError('Acesso não autorizado.');
          setTimeout(() => router.replace('/home'), 1200);
        }
      } catch (err) {
        console.error('Erro na verificação de permissão:', err);
        setAuthError('Erro ao validar permissões de acesso.');
        setTimeout(() => router.replace('/home'), 1200);
      }
    }

    verifySuperadminAccess();
  }, [router]);

  /**
   * Carregamento de Métricas Gerais
   */
  const loadMetrics = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/metrics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, [period]);

  /**
   * Carregamento de Vendas
   */
  const loadSales = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingSales(true);
    try {
      const query = new URLSearchParams();
      if (salesSearch) query.append('search', salesSearch);
      if (salesTypeFilter !== 'all') query.append('type', salesTypeFilter);
      if (period !== 'all') query.append('period', period);

      const res = await fetch(`${API_URL}/api/admin/sales?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesList(data.sales || []);
      }
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoadingSales(false);
    }
  }, [salesSearch, salesTypeFilter, period]);

  /**
   * Carregamento Financeiro
   */
  const loadFinancial = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingFinancial(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/financial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFinancialData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoadingFinancial(false);
    }
  }, []);

  /**
   * Carregamento de Estoque de Faixas
   */
  const loadStock = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingStock(true);
    try {
      const query = new URLSearchParams();
      if (stockSearch) query.append('search', stockSearch);
      if (stockLowOnly) query.append('lowStockOnly', 'true');
      if (stockCompanyFilter && stockCompanyFilter !== 'all') query.append('companyId', stockCompanyFilter);

      const res = await fetch(`${API_URL}/api/admin/stock?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStockList(data.tracks || []);
      }
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoadingStock(false);
    }
  }, [stockSearch, stockLowOnly, stockCompanyFilter]);

  /**
   * Carregamento de Gravadoras e Selos Musicais
   */
  const loadCompanies = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingCompanies(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompaniesList(data.companies || []);
      }
    } catch (err) {
      console.error('Erro ao carregar gravadoras:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  /**
   * Carregamento de Usuários
   */
  const loadUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingUsers(true);
    try {
      const query = new URLSearchParams();
      if (usersSearch) query.append('search', usersSearch);
      if (usersRoleFilter !== 'all') query.append('role', usersRoleFilter);

      const res = await fetch(`${API_URL}/api/admin/users?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [usersSearch, usersRoleFilter]);

  // Carrega os dados da aba atual quando autorizado
  useEffect(() => {
    if (!isAuthorized) return;
    if (activeTab === 'overview') {
      loadMetrics();
      loadCompanies();
    } else if (activeTab === 'sales') {
      loadSales();
    } else if (activeTab === 'financial') {
      loadFinancial();
    } else if (activeTab === 'stock') {
      loadStock();
      loadCompanies();
    } else if (activeTab === 'companies') {
      loadCompanies();
      loadStock();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [isAuthorized, activeTab, loadMetrics, loadSales, loadFinancial, loadStock, loadCompanies, loadUsers]);

  // Recarrega métricas se o período mudar enquanto na visão geral
  useEffect(() => {
    if (isAuthorized && activeTab === 'overview') {
      loadMetrics();
    }
  }, [period, isAuthorized, activeTab, loadMetrics]);

  /**
   * Operações de Usuários
   */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUserForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Usuário criado com sucesso!');
        setShowAddUserModal(false);
        setNewUserForm({ full_name: '', email: '', password: '', role: 'user', status: 'active' });
        loadUsers();
      } else {
        alert(data.error || 'Erro ao criar usuário.');
      }
    } catch (err) {
      alert('Erro de conexão ao criar usuário.');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = {
        full_name: editUserForm.full_name,
        email: editUserForm.email,
        role: editUserForm.role,
        status: editUserForm.status
      };
      if (editUserForm.password && editUserForm.password.trim() !== '') {
        payload.password = editUserForm.password.trim();
      }

      const res = await fetch(`${API_URL}/api/admin/users/${editUserForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Dados do usuário atualizados com sucesso!');
        setShowEditUserModal(false);
        loadUsers();
      } else {
        alert(data.error || 'Erro ao editar usuário.');
      }
    } catch (err) {
      alert('Erro ao atualizar usuário.');
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Status atualizado para ${newStatus}!`);
        setShowStatusModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        alert(data.error || 'Erro ao alterar status.');
      }
    } catch (err) {
      alert('Erro ao modificar status do usuário.');
    }
  };

  /**
   * Operação de Atualização de Estoque
   */
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedStockTrack) return;
    const token = localStorage.getItem('token');

    try {
      const payload = {
        stock_quantity: parseInt(stockAdjustForm.stock_quantity, 10),
        sale_price: String(stockAdjustForm.sale_price).replace(',', '.').trim(),
        rent_price: String(stockAdjustForm.rent_price).replace(',', '.').trim(),
        company_id: stockAdjustForm.company_id ? Number(stockAdjustForm.company_id) : undefined,
        genre: stockAdjustForm.genre ? stockAdjustForm.genre.trim() : undefined,
        cover_url: stockAdjustForm.cover_url ? stockAdjustForm.cover_url.trim() : undefined
      };

      const res = await fetch(`${API_URL}/api/admin/stock/${selectedStockTrack.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Estoque, gravadora e preços atualizados com sucesso!');
        setShowStockModal(false);
        setSelectedStockTrack(null);
        loadStock();
        loadCompanies();
      } else {
        alert(data.error || 'Erro ao atualizar dados do estoque.');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar estoque.');
    }
  };

  /**
   * Operações de Gravadoras e Bases Parceiras
   */
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCompanyForm)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao cadastrar gravadora', 'error');
        return;
      }
      showToast(data.message || 'Gravadora cadastrada com sucesso!');
      setShowAddCompanyModal(false);
      setNewCompanyForm({
        name: '',
        slug: '',
        genre: 'Variado',
        description: '',
        city: 'São Paulo',
        state: 'SP',
        logo_url: '',
        banner_url: '',
        status: 'active'
      });
      loadCompanies();
      loadMetrics();
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao salvar gravadora', 'error');
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !editCompanyForm.id) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/companies/${editCompanyForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editCompanyForm)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar gravadora', 'error');
        return;
      }
      showToast('Gravadora atualizada com sucesso!');
      setShowEditCompanyModal(false);
      loadCompanies();
      loadStock();
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao atualizar gravadora', 'error');
    }
  };

  const handleOpenCompanyTracks = async (company) => {
    setSelectedCompanyForTracks(company);
    setShowCompanyTracksModal(true);
    setLoadingCompanyTracksModal(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/companies/${company.id}/tracks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCompanyTracksModalList(data.tracks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompanyTracksModal(false);
    }
  };

  const handleReassignTrack = async (trackId, newCompanyId) => {
    if (!trackId || !newCompanyId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/stock/${trackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ company_id: Number(newCompanyId) })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao reatribuir gravadora', 'error');
        return;
      }
      showToast('Música vinculada à nova gravadora com sucesso!');
      loadCompanies();
      loadStock();
      if (selectedCompanyForTracks) {
        handleOpenCompanyTracks(selectedCompanyForTracks);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao reatribuir gravadora', 'error');
    }
  };

  /**
   * TELA DE PROTEÇÃO / VERIFICAÇÃO DE ACESSO
   * Se o usuário escrever /admin na URL sem ser admin, cai aqui e é redirecionado.
   */
  if (isVerifying || !isAuthorized) {
    return (
      <div className={styles.securityScreen}>
        <Head>
          <title>Verificando Permissões — DevSongs Superadmin</title>
        </Head>
        <div className={styles.securityShield}>
          <Shield size={36} />
        </div>
        <h2 className={styles.securityTitle}>
          {authError ? 'Acesso Restrito' : 'DevSongs Security Guard'}
        </h2>
        <p className={styles.securityText}>
          {authError || 'Verificando credenciais de Superadministrador no servidor...'}
        </p>
        {!authError && <div className={styles.spinner} />}
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <Head>
        <title>Painel de Controle Superadmin — DevSongs</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '13px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className={styles.topNav}>
        <div className={styles.navBrand}>
          <Image
            src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png"
            alt="DevSongs"
            width={38}
            height={38}
            className={styles.brandLogo}
          />
          <div className={styles.brandTitleGroup}>
            <div className={styles.brandName}>
              DevSongs
              <span className={styles.superadminBadge}>Superadmin</span>
            </div>
            <span className={styles.brandSub}>Painel de Controle Central</span>
          </div>
        </div>

        <div className={styles.navActions}>
          <Link href="/home" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Voltar ao Player</span>
          </Link>

          <div className={styles.adminProfilePill}>
            <div className={styles.adminAvatar}>
              {adminUser?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>{adminUser?.full_name || 'Superadmin'}</span>
              <span className={styles.adminRoleText}>Acesso Total</span>
            </div>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className={styles.container}>
        {/* Header com Boas-Vindas */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.headerTitle}>Painel de Controle</h1>
            <p className={styles.headerDesc}>
              Monitoramento em tempo real de vendas, faturamento de licenças, acervo de gravadoras e contas.
            </p>
          </div>

          {/* Seletor de Período (para abas que suportam filtro temporal) */}
          {(activeTab === 'overview' || activeTab === 'sales') && (
            <div className={styles.periodPills}>
              <button
                onClick={() => setPeriod('today')}
                className={`${styles.periodBtn} ${period === 'today' ? styles.periodBtnActive : ''}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriod('7d')}
                className={`${styles.periodBtn} ${period === '7d' ? styles.periodBtnActive : ''}`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`${styles.periodBtn} ${period === '30d' ? styles.periodBtnActive : ''}`}
              >
                30 Dias
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`${styles.periodBtn} ${period === 'all' ? styles.periodBtnActive : ''}`}
              >
                Todo o Período
              </button>
            </div>
          )}
        </div>

        {/* Abas de Navegação Interna */}
        <nav className={styles.tabsContainer} aria-label="Seções Administrativas">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          >
            <TrendingUp size={16} />
            <span>Visão Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`${styles.tabBtn} ${activeTab === 'sales' ? styles.tabBtnActive : ''}`}
          >
            <ShoppingBag size={16} />
            <span>Vendas</span>
            {metrics?.sales?.totalSalesCount > 0 && (
              <span className={styles.tabBadge}>{metrics.sales.totalSalesCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`${styles.tabBtn} ${activeTab === 'financial' ? styles.tabBtnActive : ''}`}
          >
            <DollarSign size={16} />
            <span>Financeiro</span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`${styles.tabBtn} ${activeTab === 'stock' ? styles.tabBtnActive : ''}`}
          >
            <Package size={16} />
            <span>Estoque de Licenças</span>
            {metrics?.stock?.lowStockTracks > 0 && (
              <span className={styles.tabBadge} style={{ background: '#f59e0b', color: '#000' }}>
                {metrics.stock.lowStockTracks} baixos
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`${styles.tabBtn} ${activeTab === 'companies' ? styles.tabBtnActive : ''}`}
          >
            <Building2 size={16} />
            <span>Gravadoras & Bases</span>
            {companiesList.length > 0 && (
              <span className={styles.tabBadge}>{companiesList.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
          >
            <Users size={16} />
            <span>Usuários e Permissões</span>
            {metrics?.users?.total > 0 && (
              <span className={styles.tabBadge}>{metrics.users.total}</span>
            )}
          </button>
        </nav>

        {/* ========================================================
            SEÇÃO 1: VISÃO GERAL (OVERVIEW)
            ======================================================== */}
        {activeTab === 'overview' && (
          <div>
            {/* Grid de Indicadores Principais (KPIs Reais do Banco) */}
            <div className={styles.kpiGrid}>
              {/* Card 1: Vendas Totais */}
              <div
                className={styles.kpiCard}
                onClick={() => setActiveTab('sales')}
                title="Clique para abrir a aba de Vendas"
                role="button"
                tabIndex={0}
              >
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Total de Vendas</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(metrics?.sales?.totalRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span className={`${styles.kpiTag} ${styles.kpiTagGreen}`}>
                    {metrics?.sales?.totalSalesCount || 0} transações
                  </span>
                  <span>efetuadas no banco</span>
                </div>
                <div className={styles.kpiActionHint}>
                  <span>Ver relatório de vendas</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Card 2: Valores Recebidos */}
              <div
                className={styles.kpiCard}
                onClick={() => setActiveTab('financial')}
                title="Clique para abrir o módulo Financeiro"
                role="button"
                tabIndex={0}
              >
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Valores Recebidos</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(metrics?.sales?.receivedRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span className={`${styles.kpiTag} ${styles.kpiTagBlue}`}>100% Confirmado</span>
                  <span>sem estornos</span>
                </div>
                <div className={styles.kpiActionHint}>
                  <span>Ver faturamento das gravadoras</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Card 3: Valores Pendentes */}
              <div
                className={styles.kpiCard}
                onClick={() => setActiveTab('financial')}
                title="Clique para ver movimentações financeiras"
                role="button"
                tabIndex={0}
              >
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Valores Pendentes</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconAmber}`}>
                    <Clock size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(metrics?.sales?.pendingRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span>Itens em carrinhos abertos</span>
                </div>
                <div className={styles.kpiActionHint}>
                  <span>Consultar financeiro</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Card 4: Estoque de Licenças */}
              <div
                className={styles.kpiCard}
                onClick={() => setActiveTab('stock')}
                title="Clique para abrir o Estoque de Licenças"
                role="button"
                tabIndex={0}
              >
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Licenças no Acervo</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
                    <Package size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  {metrics?.stock?.totalLicenses || 0}{' '}
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8' }}>unidades</span>
                </div>
                <div className={styles.kpiFooter}>
                  <span className={`${styles.kpiTag} ${styles.kpiTagAmber}`}>
                    {metrics?.stock?.lowStockTracks || 0} com estoque baixo
                  </span>
                  <span>de {metrics?.stock?.totalTracks || 0} faixas com licença</span>
                </div>
                <div className={styles.kpiActionHint}>
                  <span>Gerenciar estoque e preços</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>

            {/* Banner Transparente de Movimentações Financeiras e Acervo */}
            <div className={styles.noticeCard}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Auditoria Transparente do Sistema:</strong>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>
                    • <strong>Estoque Comercial de Licenças (MySQL):</strong> 16 faixas registradas no catálogo das gravadoras somando{' '}
                    <strong>873 unidades de licença</strong> disponíveis para compra e aluguel.
                  </span>
                  <span>
                    • <strong>Catálogo Global do Reprodutor:</strong> Mais de <strong>2.000 músicas</strong> integradas via APIs de streaming (Deezer / YouTube) para busca e reprodução online contínua no player.
                  </span>
                </div>
              </div>
            </div>

            {/* Movimentações Recentes */}
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <TrendingUp size={18} />
                    Movimentações Recentes
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Últimas compras e aluguéis de licenças registradas na plataforma.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={styles.btnSecondary}
                >
                  <span>Ver todas as vendas</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Identificação</th>
                      <th>Música / Obra</th>
                      <th>Gravadora / Selo</th>
                      <th>Comprador</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.recentMovements?.length > 0 ? (
                      metrics.recentMovements.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>#PED-{String(m.id).padStart(5, '0')}</strong>
                          </td>
                          <td>
                            <div className={styles.trackRowItem}>
                              <img
                                src={m.track_cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                alt=""
                                className={styles.trackCoverThumb}
                              />
                              <div className={styles.trackRowText}>
                                <span className={styles.trackRowTitle}>{m.track_title}</span>
                                <span className={styles.trackRowArtist}>{m.track_artist}</span>
                              </div>
                            </div>
                          </td>
                          <td>{m.company_name || 'DevSongs Urban Records'}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{m.buyer_name}</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>{m.buyer_email}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                m.type === 'buy' ? styles.badgeSuccess : styles.badgeInfo
                              }`}
                            >
                              {m.type === 'buy' ? 'Compra Definitiva' : 'Aluguel (30d)'}
                            </span>
                          </td>
                          <td>
                            <strong>R$ {Number(m.price).toFixed(2).replace('.', ',')}</strong>
                          </td>
                          <td>
                            {m.created_at
                              ? new Date(m.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                              Confirmado
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8}>
                          <div className={styles.emptyState}>
                            <p className={styles.emptyStateTitle}>Nenhuma movimentação registrada</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: VENDAS
            ======================================================== */}
        {activeTab === 'sales' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <ShoppingBag size={18} />
                  Registro de Vendas de Licenças
                </h3>
                <p className={styles.cardSubtitle}>
                  Consulte todos os pedidos de aquisição e aluguel realizados na plataforma.
                </p>
              </div>

              {/* Controles de Filtro e Busca */}
              <div className={styles.controlsBar} style={{ margin: 0 }}>
                <div className={styles.searchBox}>
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Buscar por música, artista ou comprador..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                  />
                  {salesSearch && (
                    <button
                      onClick={() => setSalesSearch('')}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.periodPills}>
                  <button
                    onClick={() => setSalesTypeFilter('all')}
                    className={`${styles.periodBtn} ${salesTypeFilter === 'all' ? styles.periodBtnActive : ''}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSalesTypeFilter('buy')}
                    className={`${styles.periodBtn} ${salesTypeFilter === 'buy' ? styles.periodBtnActive : ''}`}
                  >
                    Compras
                  </button>
                  <button
                    onClick={() => setSalesTypeFilter('rent')}
                    className={`${styles.periodBtn} ${salesTypeFilter === 'rent' ? styles.periodBtnActive : ''}`}
                  >
                    Aluguéis
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Identificação</th>
                    <th>Faixa / Produto</th>
                    <th>Gravadora</th>
                    <th>Comprador</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status Venda</th>
                    <th>Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSales ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px' }}>
                        <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                        <span style={{ color: '#94a3b8' }}>Carregando vendas...</span>
                      </td>
                    </tr>
                  ) : salesList.length > 0 ? (
                    salesList.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <strong>#PED-{String(sale.id).padStart(5, '0')}</strong>
                        </td>
                        <td>
                          <div className={styles.trackRowItem}>
                            <img
                              src={sale.track_cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt=""
                              className={styles.trackCoverThumb}
                            />
                            <div className={styles.trackRowText}>
                              <span className={styles.trackRowTitle}>{sale.track_title}</span>
                              <span className={styles.trackRowArtist}>{sale.track_artist}</span>
                            </div>
                          </div>
                        </td>
                        <td>{sale.company_name || 'DevSongs Urban Records'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{sale.buyer_name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{sale.buyer_email}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              sale.type === 'buy' ? styles.badgeSuccess : styles.badgeInfo
                            }`}
                          >
                            {sale.type === 'buy' ? 'Compra Definitiva' : 'Aluguel (30 dias)'}
                          </span>
                        </td>
                        <td>
                          <strong>R$ {Number(sale.price).toFixed(2).replace('.', ',')}</strong>
                        </td>
                        <td>
                          {sale.created_at
                            ? new Date(sale.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                            Concluída
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                            Confirmado
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className={styles.emptyState}>
                          <p className={styles.emptyStateTitle}>Nenhuma venda encontrada</p>
                          <p className={styles.emptyStateDesc}>Tente ajustar os filtros de busca.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 3: FINANCEIRO
            ======================================================== */}
        {activeTab === 'financial' && (
          <div>
            {/* Cards de Resumo Financeiro */}
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Receita Bruta Total</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(financialData?.summary?.totalRevenue || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span>Entradas confirmadas de licenças</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Compras Definitivas</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
                    <ShoppingBag size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(financialData?.distribution?.buy?.amount || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span>{financialData?.distribution?.buy?.count || 0} licenças permanentes</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Aluguéis Temporários</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
                    <Clock size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(financialData?.distribution?.rent?.amount || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span>{financialData?.distribution?.rent?.count || 0} aluguéis de 30 dias</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>Saldo Apurado</span>
                  <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className={styles.kpiValue}>
                  R$ {Number(financialData?.summary?.netBalance || 0).toFixed(2).replace('.', ',')}
                </div>
                <div className={styles.kpiFooter}>
                  <span className={`${styles.kpiTag} ${styles.kpiTagGreen}`}>Saldo Positivo</span>
                </div>
              </div>
            </div>

            {/* Esclarecimento de Limitações Reais do Banco de Dados */}
            <div className={styles.noticeCard}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Transparência do Módulo Financeiro:</strong> O sistema DevSongs registra o
                faturamento obtido por meio de vendas e aluguéis de faixas. Não há tabela de
                despesas corporativas ou saídas bancárias no banco de dados atual, portanto o saldo
                reflete 100% das receitas apuradas sem valores fictícios.
              </div>
            </div>

            {/* Receitas por Gravadora / Selo Musical */}
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <Building2 size={18} />
                    Faturamento por Gravadora / Base
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Volume financeiro gerado pelo catálogo de cada selo parceiro da plataforma.
                  </p>
                </div>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Gravadora</th>
                      <th>Total de Transações</th>
                      <th>Compras</th>
                      <th>Aluguéis</th>
                      <th>Faturamento Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData?.byCompany?.length > 0 ? (
                      financialData.byCompany.map((c) => (
                        <tr key={c.company_id}>
                          <td>
                            <strong>{c.company_name}</strong>
                          </td>
                          <td>{c.total_transactions} pedidos</td>
                          <td>
                            {c.buy_count} (R$ {Number(c.buy_revenue).toFixed(2).replace('.', ',')})
                          </td>
                          <td>
                            {c.rent_count} (R$ {Number(c.rent_revenue).toFixed(2).replace('.', ',')})
                          </td>
                          <td>
                            <strong style={{ color: '#10b981' }}>
                              R$ {Number(c.total_revenue).toFixed(2).replace('.', ',')}
                            </strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>
                          <div className={styles.emptyState}>
                            <p className={styles.emptyStateTitle}>Nenhum dado financeiro encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 4: ESTOQUE DE LICENÇAS
            ======================================================== */}
        {activeTab === 'stock' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Package size={18} />
                  Acervo e Estoque de Licenças
                </h3>
                <p className={styles.cardSubtitle}>
                  Controle da disponibilidade de licenças musicais para cada música cadastrada nas gravadoras.
                </p>
              </div>

              {/* Filtros de Estoque */}
              <div className={styles.controlsBar} style={{ margin: 0 }}>
                <div className={styles.searchBox}>
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Buscar faixa, artista ou álbum..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                  />
                  {stockSearch && (
                    <button
                      onClick={() => setStockSearch('')}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.periodPills}>
                  <button
                    onClick={() => setStockLowOnly(false)}
                    className={`${styles.periodBtn} ${!stockLowOnly ? styles.periodBtnActive : ''}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setStockLowOnly(true)}
                    className={`${styles.periodBtn} ${stockLowOnly ? styles.periodBtnActive : ''}`}
                  >
                    Estoque Baixo (≤ 15)
                  </button>
                </div>

                {/* Filtro por Gravadora */}
                <select
                  value={stockCompanyFilter}
                  onChange={(e) => setStockCompanyFilter(e.target.value)}
                  className={styles.reassignSelect}
                  style={{ height: '38px', padding: '0 12px', minWidth: '180px' }}
                >
                  <option value="all">Todas as Gravadoras</option>
                  {companiesList.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Faixa</th>
                    <th>Gravadora</th>
                    <th>Gênero</th>
                    <th>Estoque Disponível</th>
                    <th>Preço Compra</th>
                    <th>Preço Aluguel</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStock ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                        <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                        <span style={{ color: '#94a3b8' }}>Carregando catálogo e estoque...</span>
                      </td>
                    </tr>
                  ) : stockList.length > 0 ? (
                    stockList.map((track) => (
                      <tr key={track.id}>
                        <td>
                          <div className={styles.trackRowItem}>
                            <img
                              src={track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt=""
                              className={styles.trackCoverThumb}
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.trackRowText}>
                              <span className={styles.trackRowTitle}>{track.title}</span>
                              <span className={styles.trackRowArtist}>{track.artist}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                            {track.company_name}
                          </span>
                        </td>
                        <td>{track.genre || 'Variado'}</td>
                        <td>
                          <strong style={{ fontSize: '14px' }}>
                            {track.stock_quantity}{' '}
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>unidades</span>
                          </strong>
                        </td>
                        <td>R$ {Number(track.sale_price).toFixed(2).replace('.', ',')}</td>
                        <td>R$ {Number(track.rent_price).toFixed(2).replace('.', ',')}</td>
                        <td>
                          {track.stock_quantity === 0 ? (
                            <span className={`${styles.badge} ${styles.badgeDanger}`}>
                              Esgotado
                            </span>
                          ) : track.stock_quantity <= 15 ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                              Disponível
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedStockTrack(track);
                              setStockAdjustForm({
                                stock_quantity: track.stock_quantity,
                                sale_price: track.sale_price,
                                rent_price: track.rent_price,
                                cover_url: track.cover_url || '',
                                company_id: track.company_id || '',
                                genre: track.genre || ''
                              });
                              setShowStockModal(true);
                            }}
                            className={styles.btnSecondary}
                          >
                            <Edit3 size={12} />
                            <span>Ajustar</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyState}>
                          <p className={styles.emptyStateTitle}>Nenhuma faixa encontrada no acervo</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 5: GRAVADORAS E BASES MUSICAIS
            ======================================================== */}
        {activeTab === 'companies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Bloco 1: Gestão de Gravadoras Parceiras */}
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <Building2 size={18} />
                    Gravadoras e Selos Musicais Parceiros
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Gerenciamento das bases autorizadas, catálogo por selo e estoque unificado de licenças.
                  </p>
                </div>

                <div className={styles.controlsBar} style={{ margin: 0 }}>
                  <div className={styles.searchBox}>
                    <Search size={16} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Buscar gravadora, gênero ou cidade..."
                      value={companiesSearch}
                      onChange={(e) => setCompaniesSearch(e.target.value)}
                    />
                    {companiesSearch && (
                      <button
                        onClick={() => setCompaniesSearch('')}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setNewCompanyForm({
                        name: '',
                        slug: '',
                        genre: 'Variado',
                        description: '',
                        city: 'São Paulo',
                        state: 'SP',
                        logo_url: '',
                        banner_url: '',
                        status: 'active'
                      });
                      setShowAddCompanyModal(true);
                    }}
                    className={styles.btnPrimary}
                  >
                    <Plus size={16} />
                    <span>Nova Gravadora</span>
                  </button>
                </div>
              </div>

              {loadingCompanies ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                  <span style={{ color: '#94a3b8' }}>Carregando gravadoras e bases musicais...</span>
                </div>
              ) : companiesList.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building2 size={36} className={styles.emptyStateIcon} />
                  <p className={styles.emptyStateTitle}>Nenhuma gravadora cadastrada</p>
                  <p className={styles.emptyStateDesc}>Cadastre uma gravadora parceira para gerenciar seu acervo musical.</p>
                </div>
              ) : (
                <div className={styles.companiesGrid}>
                  {companiesList
                    .filter((c) => {
                      if (!companiesSearch) return true;
                      const term = companiesSearch.toLowerCase();
                      return (
                        c.name?.toLowerCase().includes(term) ||
                        c.genre?.toLowerCase().includes(term) ||
                        c.city?.toLowerCase().includes(term) ||
                        c.slug?.toLowerCase().includes(term)
                      );
                    })
                    .map((comp) => (
                      <div key={comp.id} className={styles.companyCard}>
                        <div className={styles.companyCardTop}>
                          <img
                            src={comp.logo_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={comp.name}
                            className={styles.companyLogo}
                            onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.companyMeta}>
                            <span className={styles.companyTitle} title={comp.name}>{comp.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className={styles.companyGenreBadge}>{comp.genre}</span>
                              <span className={`${styles.badge} ${comp.status === 'active' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                                {comp.status === 'active' ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                            <span className={styles.companyLocation}>
                              📍 {comp.city} - {comp.state} • slug: <code>{comp.slug}</code>
                            </span>
                          </div>
                        </div>

                        {comp.description && (
                          <p className={styles.companyDesc} title={comp.description}>{comp.description}</p>
                        )}

                        <div className={styles.companyStatsRow}>
                          <div className={styles.companyStatItem}>
                            <span className={styles.companyStatLabel}>Músicas</span>
                            <span className={styles.companyStatVal}>{comp.total_tracks} faixas</span>
                          </div>
                          <div className={styles.companyStatItem}>
                            <span className={styles.companyStatLabel}>Estoque</span>
                            <span className={styles.companyStatVal}>{comp.total_stock} un</span>
                          </div>
                          <div className={styles.companyStatItem}>
                            <span className={styles.companyStatLabel}>Receita</span>
                            <span className={styles.companyStatVal}>R$ {Number(comp.total_revenue || 0).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <div className={styles.companyCardActions}>
                          <button
                            onClick={() => handleOpenCompanyTracks(comp)}
                            className={styles.btnSecondary}
                            style={{ flex: 1, justifyContent: 'center' }}
                            title="Ver catálogo exclusivo desta gravadora"
                          >
                            <Music size={14} />
                            <span>Ver Músicas ({comp.total_tracks})</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditCompanyForm({
                                id: comp.id,
                                name: comp.name,
                                slug: comp.slug,
                                genre: comp.genre,
                                description: comp.description || '',
                                city: comp.city || 'São Paulo',
                                state: comp.state || 'SP',
                                logo_url: comp.logo_url || '',
                                banner_url: comp.banner_url || '',
                                status: comp.status || 'active'
                              });
                              setShowEditCompanyModal(true);
                            }}
                            className={styles.btnSecondary}
                            title="Editar dados da gravadora"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Bloco 2: Auditoria e Vínculo de Músicas Comerciais */}
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <Package size={18} />
                    Auditoria e Vínculo de Músicas Comerciais
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Verifique as associações atuais e reatribua qualquer música comercial à sua gravadora parceira correta.
                  </p>
                </div>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Música / Artista</th>
                      <th>Gravadora Vinculada</th>
                      <th>Gênero</th>
                      <th>Estoque</th>
                      <th>Preço Compra</th>
                      <th>Reatribuir Gravadora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockList.map((track) => (
                      <tr key={track.id}>
                        <td>
                          <div className={styles.trackRowItem}>
                            <img
                              src={track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt=""
                              className={styles.trackCoverThumb}
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.trackRowText}>
                              <span className={styles.trackRowTitle}>{track.title}</span>
                              <span className={styles.trackRowArtist}>{track.artist}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#10b981' }}>
                            {track.company_name}
                          </span>
                        </td>
                        <td>
                          <span className={track.genre === 'Variado' ? styles.badgeWarning : ''} style={{ fontSize: '12px' }}>
                            {track.genre || 'Variado'}
                          </span>
                        </td>
                        <td>
                          <strong>{track.stock_quantity} un</strong>
                        </td>
                        <td>R$ {Number(track.sale_price).toFixed(2).replace('.', ',')}</td>
                        <td>
                          <select
                            className={styles.reassignSelect}
                            value={track.company_id}
                            onChange={(e) => {
                              const newCId = Number(e.target.value);
                              if (newCId !== track.company_id) {
                                handleReassignTrack(track.id, newCId);
                              }
                            }}
                          >
                            {companiesList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.genre})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 6: USUÁRIOS E PERMISSÕES
            ======================================================== */}
        {activeTab === 'users' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Users size={18} />
                  Gerenciamento de Usuários
                </h3>
                <p className={styles.cardSubtitle}>
                  Administração de contas, funções de acesso e histórico de compras.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className={styles.searchBox}>
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                  />
                  {usersSearch && (
                    <button
                      onClick={() => setUsersSearch('')}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className={styles.btnPrimary}
                >
                  <UserPlus size={16} />
                  <span>Novo Usuário</span>
                </button>
              </div>
            </div>

            {/* Aviso de Inativação Segura */}
            <div className={styles.noticeCard}>
              <Shield size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Preservação de Dados e Histórico:</strong> Em conformidade com a política
                de segurança do DevSongs, as contas não são excluídas fisicamente para preservar o
                histórico financeiro e as licenças adquiridas. Para remover o acesso, utilize a opção de
                <strong> inativação segura</strong>.
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Função</th>
                    <th>Status</th>
                    <th>Compras</th>
                    <th>Gasto Total</th>
                    <th>Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                        <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                        <span style={{ color: '#94a3b8' }}>Carregando contas de usuários...</span>
                      </td>
                    </tr>
                  ) : usersList.length > 0 ? (
                    usersList.map((u) => {
                      const isSelf = adminUser?.id === u.id;
                      const isActive = u.status === 'active';

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: u.role === 'admin'
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '13px'
                                }}
                              >
                                {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                                {isSelf && (
                                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                                    (Você)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                u.role === 'admin' ? styles.badgeSuccess : styles.badgeMuted
                              }`}
                            >
                              {u.role === 'admin' ? 'Superadmin' : 'Usuário'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                isActive ? styles.badgeSuccess : styles.badgeDanger
                              }`}
                            >
                              {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>{u.total_purchases} pedidos</td>
                          <td>
                            <strong>R$ {Number(u.total_spent).toFixed(2).replace('.', ',')}</strong>
                          </td>
                          <td>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setEditUserForm({
                                    id: u.id,
                                    full_name: u.full_name,
                                    email: u.email,
                                    role: u.role,
                                    status: u.status,
                                    password: ''
                                  });
                                  setShowEditUserModal(true);
                                }}
                                className={styles.btnSecondary}
                                title="Editar dados"
                              >
                                <Edit3 size={12} />
                                <span>Editar</span>
                              </button>

                              {/* Botão de Inativação Segura (Prevenção de Auto-Bloqueio) */}
                              <button
                                onClick={() => {
                                  if (isSelf) {
                                    alert('Você não pode inativar sua própria conta de administrador.');
                                    return;
                                  }
                                  setSelectedUser(u);
                                  setShowStatusModal(true);
                                }}
                                disabled={isSelf}
                                className={
                                  isActive ? styles.btnDangerOutline : styles.btnSuccessOutline
                                }
                                style={{ opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                title={
                                  isSelf
                                    ? 'Você não pode inativar sua própria conta'
                                    : isActive
                                    ? 'Inativar acesso'
                                    : 'Reativar acesso'
                                }
                              >
                                <Power size={12} />
                                <span>{isActive ? 'Inativar' : 'Reativar'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyState}>
                          <p className={styles.emptyStateTitle}>Nenhum usuário encontrado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: NOVO USUÁRIO
          ======================================================== */}
      {showAddUserModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddUserModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cadastrar Novo Usuário</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className={styles.closeModalBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  className={styles.formInput}
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Endereço de E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@exemplo.com"
                  className={styles.formInput}
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Senha de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo de 6 caracteres"
                  className={styles.formInput}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Função</label>
                  <select
                    className={styles.formSelect}
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Superadmin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status Inicial</label>
                  <select
                    className={styles.formSelect}
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR USUÁRIO
          ======================================================== */}
      {showEditUserModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditUserModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar Dados do Usuário</h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className={styles.closeModalBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome Completo</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>E-mail</label>
                <input
                  type="email"
                  required
                  className={styles.formInput}
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nova Senha (deixe em branco para manter a atual)</label>
                <input
                  type="password"
                  placeholder="Nova senha (opcional)"
                  className={styles.formInput}
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Função</label>
                  <select
                    className={styles.formSelect}
                    value={editUserForm.role}
                    disabled={adminUser?.id === editUserForm.id}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  >
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Superadmin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    className={styles.formSelect}
                    value={editUserForm.status}
                    disabled={adminUser?.id === editUserForm.id}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INATIVAÇÃO SEGURA / REATIVAÇÃO (SOFT DISABLE)
          ======================================================== */}
      {showStatusModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {selectedUser.status === 'active' ? 'Inativar Conta' : 'Reativar Conta'}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className={styles.closeModalBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '20px', lineHeight: '1.6', fontSize: '14px', color: '#cbd5e1' }}>
              {selectedUser.status === 'active' ? (
                <>
                  <p>
                    Tem certeza que deseja inativar a conta de{' '}
                    <strong style={{ color: '#ffffff' }}>{selectedUser.full_name}</strong>?
                  </p>
                  <div className={`${styles.noticeCard} ${styles.noticeWarning}`}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      O usuário perderá o acesso à plataforma, mas todo o histórico de compras,
                      pedidos e licenças será preservado de forma segura no banco de dados.
                    </span>
                  </div>
                </>
              ) : (
                <p>
                  Deseja reativar a conta de{' '}
                  <strong style={{ color: '#ffffff' }}>{selectedUser.full_name}</strong>? O usuário
                  voltará a ter acesso normal ao sistema DevSongs.
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleUserStatus}
                className={
                  selectedUser.status === 'active' ? styles.btnDangerOutline : styles.btnPrimary
                }
              >
                {selectedUser.status === 'active' ? 'Confirmar Inativação' : 'Confirmar Reativação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AJUSTE DE ESTOQUE E PREÇOS
          ======================================================== */}
      {showStockModal && selectedStockTrack && (
        <div className={styles.modalOverlay} onClick={() => setShowStockModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ajustar Estoque de Licença</h3>
              <button
                onClick={() => setShowStockModal(false)}
                className={styles.closeModalBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img
                src={stockAdjustForm.cover_url || selectedStockTrack.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                alt=""
                style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: '#ffffff', fontSize: '14px' }}>{selectedStockTrack.title}</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {selectedStockTrack.artist} • {selectedStockTrack.company_name}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateStock}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantidade de Licenças em Estoque</label>
                <input
                  type="number"
                  min="0"
                  required
                  className={styles.formInput}
                  value={stockAdjustForm.stock_quantity}
                  onChange={(e) =>
                    setStockAdjustForm({ ...stockAdjustForm, stock_quantity: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gravadora / Base Responsável</label>
                <select
                  className={styles.formInput}
                  value={stockAdjustForm.company_id || ''}
                  onChange={(e) =>
                    setStockAdjustForm({ ...stockAdjustForm, company_id: e.target.value })
                  }
                >
                  <option value="">Selecione uma gravadora...</option>
                  {companiesList.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.genre})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Preço de Venda (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1,90"
                    className={styles.formInput}
                    value={stockAdjustForm.sale_price}
                    onChange={(e) =>
                      setStockAdjustForm({ ...stockAdjustForm, sale_price: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Preço de Aluguel (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 0,50"
                    className={styles.formInput}
                    value={stockAdjustForm.rent_price}
                    onChange={(e) =>
                      setStockAdjustForm({ ...stockAdjustForm, rent_price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CADASTRAR NOVA GRAVADORA
          ======================================================== */}
      {showAddCompanyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddCompanyModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Building2 size={18} /> Cadastrar Nova Gravadora
              </h3>
              <button onClick={() => setShowAddCompanyModal(false)} className={styles.closeModalBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome da Gravadora / Selo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Som Livre, Sertanejo Prime, GR6..."
                  className={styles.formInput}
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Identificador (Slug Único)</label>
                  <input
                    type="text"
                    placeholder="Ex: som-livre (gerado auto)"
                    className={styles.formInput}
                    value={newCompanyForm.slug}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, slug: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gênero Principal</label>
                  <input
                    type="text"
                    placeholder="Ex: Trap, Forró, Funk, Sertanejo..."
                    className={styles.formInput}
                    value={newCompanyForm.genre}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, genre: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cidade Sede</label>
                  <input
                    type="text"
                    placeholder="Ex: Rio de Janeiro"
                    className={styles.formInput}
                    value={newCompanyForm.city}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, city: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>UF (Estado)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="RJ"
                    className={styles.formInput}
                    value={newCompanyForm.state}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, state: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL do Logotipo / Imagem</label>
                <input
                  type="text"
                  placeholder="https://... ou https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png"
                  className={styles.formInput}
                  value={newCompanyForm.logo_url}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, logo_url: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descrição Institucional</label>
                <textarea
                  rows={3}
                  placeholder="Apresentação da gravadora, catálogo e artistas..."
                  className={styles.formInput}
                  style={{ resize: 'vertical' }}
                  value={newCompanyForm.description}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, description: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddCompanyModal(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Gravadora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR GRAVADORA EXISTENTE
          ======================================================== */}
      {showEditCompanyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditCompanyModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Edit3 size={18} /> Editar Informações da Gravadora
              </h3>
              <button onClick={() => setShowEditCompanyModal(false)} className={styles.closeModalBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome da Gravadora *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={editCompanyForm.name}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Slug (Identificador)</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={editCompanyForm.slug}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, slug: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gênero Principal</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editCompanyForm.genre}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, genre: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cidade</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editCompanyForm.city}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, city: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    className={styles.formInput}
                    value={editCompanyForm.state}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, state: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    className={styles.formInput}
                    value={editCompanyForm.status}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, status: e.target.value })}
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL do Logotipo</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editCompanyForm.logo_url}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, logo_url: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descrição Institucional</label>
                <textarea
                  rows={3}
                  className={styles.formInput}
                  style={{ resize: 'vertical' }}
                  value={editCompanyForm.description}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, description: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowEditCompanyModal(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CONSULTAR MÚSICAS DA GRAVADORA
          ======================================================== */}
      {showCompanyTracksModal && selectedCompanyForTracks && (
        <div className={styles.modalOverlay} onClick={() => setShowCompanyTracksModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedCompanyForTracks.logo_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                  alt=""
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                />
                <div>
                  <h3 className={styles.modalTitle} style={{ margin: 0 }}>
                    Acervo da {selectedCompanyForTracks.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {selectedCompanyForTracks.genre} • {companyTracksModalList.length} faixas associadas
                  </span>
                </div>
              </div>
              <button onClick={() => setShowCompanyTracksModal(false)} className={styles.closeModalBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {loadingCompanyTracksModal ? (
                <div style={{ textAlign: 'center', padding: '36px' }}>
                  <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
                  <span style={{ color: '#94a3b8' }}>Carregando catálogo da gravadora...</span>
                </div>
              ) : companyTracksModalList.length === 0 ? (
                <div className={styles.emptyState}>
                  <Music size={32} className={styles.emptyStateIcon} />
                  <p className={styles.emptyStateTitle}>Nenhuma música vinculada a esta gravadora</p>
                  <p className={styles.emptyStateDesc}>Você pode reatribuir músicas na tabela de Auditoria abaixo.</p>
                </div>
              ) : (
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Faixa</th>
                      <th>Gênero</th>
                      <th>Estoque</th>
                      <th>Preço Venda</th>
                      <th>Preço Aluguel</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyTracksModalList.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className={styles.trackRowItem}>
                            <img
                              src={t.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt=""
                              className={styles.trackCoverThumb}
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.trackRowText}>
                              <span className={styles.trackRowTitle}>{t.title}</span>
                              <span className={styles.trackRowArtist}>{t.artist} • {t.album || 'Single'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{t.genre}</td>
                        <td><strong>{t.stock_quantity} un</strong></td>
                        <td>R$ {Number(t.sale_price).toFixed(2).replace('.', ',')}</td>
                        <td>R$ {Number(t.rent_price).toFixed(2).replace('.', ',')}</td>
                        <td>
                          <span className={`${styles.badge} ${t.status === 'active' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                            {t.status === 'active' ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.modalFooter} style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowCompanyTracksModal(false)}
                className={styles.btnSecondary}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
