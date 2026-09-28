import { useEffect, useState } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom'; // 🌟 ADICIONADO: useNavigate

import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext'; // 🌟 ADICIONADO: useAuth
import AdminSidebar from '../../components/admin/AdminSidebar';

import styles from './AdminLayout.module.css';

export default function AdminLayout() {

    const { companySlug } = useParams();

    const navigate = useNavigate(); // 🌟 Inicializa o hook de navegação

    const { user, logout } = useAuth(); // 🌟 Captura o usuário logado e a função de sair

    const [company, setCompany] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [isMenuOpen, setIsMenuOpen] = useState(false);


    /*
     * =========================================================
     * CARREGA EMPRESA E VALIDA SEGURANÇA (MULTITENANCY)
     * =========================================================
     */

    useEffect(() => {

        async function loadCompany() {

            try {

                setLoading(true);

                setError('');

                const response =
                    await appointmentService.getCompanyBySlug(
                        companySlug
                    );

                // 🌟 Mapeamento resiliente do ID para garantir compatibilidade com o Axios
                const fetchedCompany = response?.company || response?.data?.company || response?.data || response;
                
                if (!fetchedCompany) {
                    setError('Empresa não encontrada.');
                    return;
                }

                // 🛡️ TRAVA DE SEGURANÇA CRÍTICA:
                // Se o usuário estiver logado, mas o companyId do token for diferente do ID da empresa da URL, expulsa
                if (user && user.companyId && fetchedCompany._id && user.companyId !== fetchedCompany._id) {
                    alert("Acesso negado: Você não tem permissão para gerenciar este estabelecimento.");
                    logout(); // Limpa os dados do localStorage por segurança
                    navigate(`/${companySlug}/login`, { replace: true });
                    return;
                }

                setCompany(fetchedCompany);

            } catch (err) {

                setError(
                    err.message ||
                    'Empresa não encontrada.'
                );

            } finally {

                setLoading(false);

            }

        }

        if (companySlug) {

            loadCompany();

        }

    }, [companySlug, user, navigate, logout]); // 🌟 Adicionadas as dependências de segurança


    /*
     * =========================================================
     * MENU MOBILE
     * =========================================================
     */

    const toggleMenu = () => {

        setIsMenuOpen(
            previous => !previous
        );

    };


    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (loading) {

        return (
            <div className={styles.centerScreen}>
                Carregando painel...
            </div>
        );

    }


    /*
     * =========================================================
     * ERRO
     * =========================================================
     */

    if (error) {

        return (
            <div
                className={`${styles.centerScreen} ${styles.errorText}`}
            >
                ⚠️ {error}
            </div>
        );

    }


    /*
     * =========================================================
     * LAYOUT
     * =========================================================
     */

    return (

        <div className={styles.layoutContainer}>

            {/* =================================================
                HEADER MOBILE
            ================================================= */}

            <header className={styles.mobileHeader}>

                <span className={styles.mobileTitle}>
                    {company?.name || 'Painel'}
                </span>

                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={toggleMenu}
                >
                    ☰
                </button>

            </header>


            {/* =================================================
                OVERLAY MOBILE
            ================================================= */}

            {isMenuOpen && (

                <div
                    className={styles.overlay}
                    onClick={toggleMenu}
                />

            )}


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`${styles.sidebar} ${
                    isMenuOpen
                        ? styles.sidebarOpen
                        : ''
                }`}
            >

                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={toggleMenu}
                >
                    ✕ Fechar Menu
                </button>

                <AdminSidebar
                    company={company}
                />

            </aside>


            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <main className={styles.mainContent}>

                <Outlet
                    context={{
                        company
                    }}
                />

            </main>

        </div>

    );
}
