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

    const [loadedCompanySlug, setLoadedCompanySlug] = useState(null);

    const [error, setError] = useState('');

    const [isMenuOpen, setIsMenuOpen] = useState(false);


    /*
     * =========================================================
     * CARREGA EMPRESA E VALIDA SEGURANÇA (MULTITENANCY)
     * =========================================================
     */

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCompany() {
            try {
                const response = await appointmentService.getCompanyBySlug(companySlug);
                const fetchedCompany = response?.company || response?.data?.company || response?.data || response;

                if (!isCurrentRequest) return;

                if (!fetchedCompany) {
                    setError('Empresa não encontrada.');
                    setLoadedCompanySlug(companySlug);
                    return;
                }

                if (user?.companyId && fetchedCompany._id && user.companyId !== fetchedCompany._id) {
                    logout();
                    navigate(`/${companySlug}/login`, { replace: true });
                    return;
                }

                setCompany(fetchedCompany);
                setError('');
                setLoadedCompanySlug(companySlug);
            } catch (err) {
                if (isCurrentRequest) {
                    setError(err.message || 'Empresa não encontrada.');
                    setLoadedCompanySlug(companySlug);
                }
            }
        }

        if (companySlug) loadCompany();

        return () => {
            isCurrentRequest = false;
        };
    }, [companySlug, user, navigate, logout]);

    const loading = loadedCompanySlug !== companySlug;
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

                <Outlet context={{ company, updateCompany: setCompany }} />

            </main>

        </div>

    );
}
