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
    
    // NOVO: Estado para gerenciar se o menu lateral está aberto no mobile
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        async function loadCompany() {
            try {
                setLoading(true);
                setError('');
                const response = await appointmentService.getCompanyBySlug(companySlug);
                setCompany(response.company);
            } catch (err) {
                setError(err.message || 'Empresa não encontrada.');
            } finally {
                setLoading(false);
            }
        }

        if (companySlug) {
            loadCompany();
        }
    }, [companySlug]);

    // Fecha o menu automaticamente se a tela mudar de tamanho ou se clicar em um link
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    if (loading) return <div className={styles.centerScreen}>Carregando painel...</div>;
    if (error) return <div className={`${styles.centerScreen} ${styles.errorText}`}>⚠️ {error}</div>;

    return (
        <div className={styles.layoutContainer}>
            
            {/* CABEÇALHO TOPBAR EXCLUSIVO PARA CELULAR */}
            <header className={styles.mobileHeader}>
                <span className={styles.mobileTitle}>{company?.name || 'Painel'}</span>
                <button type="button" className={styles.menuButton} onClick={toggleMenu}>
                    ☰
                </button>
            </header>

            {/* FUNDO ESCURECIDO CLICÁVEL NO MOBILE */}
            {isMenuOpen && <div className={styles.overlay} onClick={toggleMenu} />}

            {/* BARRA LATERAL COM CLASSE DINÂMICA DE ABERTURA */}
            <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
                {/* Botão interno para fechar o menu no celular */}
                <button type="button" className={styles.closeButton} onClick={toggleMenu}>
                    ✕ Fechar Menu
                </button>
                
                <AdminSidebar company={company} />
            </aside>

            {/* CONTEÚDO DO DASHBOARD */}
            <main className={styles.mainContent}>
                <Outlet context={{ company }} />
            </main>

        </div>
    );
}
