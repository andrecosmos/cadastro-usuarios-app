import { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';

import { appointmentService } from '../../services/appointmentService';
import AdminSidebar from '../../components/admin/AdminSidebar';

import styles from './AdminLayout.module.css';

export default function AdminLayout() {

    const { companySlug } = useParams();

    const [company, setCompany] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [isMenuOpen, setIsMenuOpen] = useState(false);


    /*
     * =========================================================
     * CARREGA EMPRESA
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

                setCompany(response.company);

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

    }, [companySlug]);


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