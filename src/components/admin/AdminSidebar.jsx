import { NavLink, useParams } from 'react-router-dom';

// 1. IMPORTAR OS ESTILOS MODULE
import styles from './AdminSidebar.module.css';

export default function AdminSidebar({ company }) {
    const { companySlug } = useParams();

    const menuItems = [
        {
            label: 'Visão Geral da Agenda',
            path: `/` + companySlug + `/admin`,
            icon: '📊',
            end: true
        },
        {
            label: 'Cadastrar Serviço',
            path: `/` + companySlug + `/admin/servicos/novo`,
            icon: '🛠️'
        },
        {
            label: 'Cadastrar Profissional',
            path: `/` + companySlug + `/admin/profissionais/novo`,
            icon: '👥'
        },
        {
            label: 'Cadastrar Cliente',
            path: `/` + companySlug + `/admin/clientes/novo`,
            icon: '👤'
        }
    ];

    return (
        <div className={styles.sidebarContainer}>

            {/* Cabeçalho da empresa */}
            <div className={styles.header}>
                <h1 className={styles.companyName}>
                    {company?.name}
                </h1>
                <span className={styles.badge}>
                    Painel Admin
                </span>
            </div>

            {/* Menu */}
            <nav className={styles.navMenu}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        /* Interpolação de classe dinâmica para identificar se o link está ativo */
                        className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.linkActive : styles.linkInactive}`
                        }
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Rodapé */}
            <div className={styles.footer}>
                v1.0.0 - SaaS Agendamentos
            </div>

        </div>
    );
}
