import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './Dashboard.module.css';

import { appointmentService } from '../../services/appointmentService';
import AppointmentList from '../../components/admin/AppointmentList';

export default function Dashboard() {

    const { company } = useOutletContext();

    const [activeMenu, setActiveMenu] = useState('dashboard');

    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );

    const [appointments, setAppointments] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [professionalFilter, setProfessionalFilter] = useState('all');

    const [configName, setConfigName] = useState('');
    const [configPhone, setConfigPhone] = useState('');

    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    const companyId = company?._id;

    /*
    |--------------------------------------------------------------------------
    | CARREGA CONFIGURAÇÕES INICIAIS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (!company) return;

        setConfigName(company.name || '');
        setConfigPhone(company.phone || '');

    }, [company]);


    /*
    |--------------------------------------------------------------------------
    | CARREGA AGENDAMENTOS
    |--------------------------------------------------------------------------
    */

    const loadAppointments = useCallback(async () => {

        if (!companyId) return;

        try {

            setLoadingAppointments(true);

            const dateParam =
                activeMenu === 'dashboard'
                    ? selectedDate
                    : '';

            const response =
                await appointmentService.listAppointments(
                    companyId,
                    dateParam
                );

            setAppointments(response.data || []);

        } catch (error) {

            console.error(
                'Erro ao carregar agendamentos:',
                error
            );

        } finally {

            setLoadingAppointments(false);

        }

    }, [
        companyId,
        selectedDate,
        activeMenu
    ]);


    useEffect(() => {

        if (
            companyId &&
            (
                activeMenu === 'dashboard' ||
                activeMenu === 'appointments'
            )
        ) {

            loadAppointments();

        }

    }, [
        companyId,
        activeMenu,
        selectedDate,
        loadAppointments
    ]);


    /*
    |--------------------------------------------------------------------------
    | ALTERAÇÃO DE STATUS
    |--------------------------------------------------------------------------
    */

    async function handleStatusChange(
        appointmentId,
        newStatus
    ) {

        const statusText =
            newStatus === 'completed'
                ? 'CONCLUÍDO'
                : 'CANCELADO';

        const confirmed = window.confirm(
            `Deseja realmente mudar o status para ${statusText}?`
        );

        if (!confirmed) return;

        try {

            await appointmentService.updateStatus(
                appointmentId,
                companyId,
                newStatus
            );

            await loadAppointments();

        } catch (error) {

            alert(
                error.message ||
                'Erro ao atualizar status.'
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CONFIGURAÇÕES DA EMPRESA
    |--------------------------------------------------------------------------
    */

    async function handleSaveSettings(event) {

        event.preventDefault();

        if (!companyId) {

            alert('Empresa não carregada.');

            return;

        }

        try {

            setIsSavingConfig(true);

            await appointmentService.updateCompany(
                companyId,
                {
                    name: configName,
                    phone: configPhone
                }
            );

            alert(
                'Configurações atualizadas com sucesso!'
            );

        } catch (error) {

            alert(
                error.message ||
                'Erro ao salvar configurações.'
            );

        } finally {

            setIsSavingConfig(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | MÉTRICAS
    |--------------------------------------------------------------------------
    */

    const metrics = useMemo(() => {

        const total = appointments.length;

        const completed =
            appointments.filter(
                appointment =>
                    appointment.status === 'completed'
            ).length;

        const canceled =
            appointments.filter(
                appointment =>
                    appointment.status === 'canceled'
            ).length;

        const pending =
            appointments.filter(
                appointment =>
                    appointment.status === 'pending'
            ).length;

        return {
            total,
            completed,
            canceled,
            pending
        };

    }, [appointments]);


    /*
    |--------------------------------------------------------------------------
    | LISTA DE PROFISSIONAIS
    |--------------------------------------------------------------------------
    */

    const professionalsList = useMemo(() => {

        const names = appointments
            .map(
                appointment =>
                    appointment.professionalId?.name
            )
            .filter(Boolean);

        return [...new Set(names)];

    }, [appointments]);


    /*
    |--------------------------------------------------------------------------
    | FILTROS
    |--------------------------------------------------------------------------
    */

    const filteredAppointments = useMemo(() => {

        return appointments.filter(
            appointment => {

                const customerName =
                    appointment.customerId?.name
                        ?.toLowerCase() || '';

                const phone =
                    appointment.customerId?.phone || '';

                const search =
                    searchTerm.toLowerCase();

                const matchesSearch =
                    customerName.includes(search) ||
                    phone.includes(searchTerm);

                const matchesStatus =
                    statusFilter === 'all' ||
                    appointment.status === statusFilter;

                const matchesProfessional =
                    professionalFilter === 'all' ||
                    appointment.professionalId?.name ===
                        professionalFilter;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesProfessional
                );

            }
        );

    }, [
        appointments,
        searchTerm,
        statusFilter,
        professionalFilter
    ]);


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (!company) {

        return (
            <div className="p-8 text-center text-gray-500">
                Carregando empresa...
            </div>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

        return (
        <div className={styles.container}>

            {/* =========================================================
                CABEÇALHO
            ========================================================= */}
            <div>
                <h1 className={styles.headerTitle}>
                    Painel Administrativo
                </h1>
                <p className={styles.headerSubtitle}>
                    {company.name}
                </p>
            </div>

            {/* =========================================================
                MENU DO PAINEL
            ========================================================= */}
            <div className={styles.menuContainer}>
                <div className={styles.menuFlex}>
                    <button
                        type="button"
                        onClick={() => setActiveMenu('dashboard')}
                        className={`${styles.menuBtn} ${
                            activeMenu === 'dashboard' ? styles.menuBtnActive : styles.menuBtnInactive
                        }`}
                    >
                        📊 Visão Geral
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMenu('appointments')}
                        className={`${styles.menuBtn} ${
                            activeMenu === 'appointments' ? styles.menuBtnActive : styles.menuBtnInactive
                        }`}
                    >
                        📋 Todos os Agendamentos
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMenu('settings')}
                        className={`${styles.menuBtn} ${
                            activeMenu === 'settings' ? styles.menuBtnActive : styles.menuBtnInactive
                        }`}
                    >
                        ⚙️ Configurações
                    </button>
                </div>
            </div>

                   {/* =========================================================
                MÉTRICAS (Mantido)
            ========================================================= */}
            {activeMenu !== 'settings' && (
                <div className={styles.metricsGrid}>
                    {/* ... Seus cards de métricas aqui ... */}
                </div>
            )}

            {/* =========================================================
                CONTEÚDO DAS ABAS DE AGENDAMENTOS (Dashboard ou Todos)
            ========================================================= */}
            {activeMenu !== 'settings' && (
                <section>
                    
                    {/* O seletor de data só aparece na aba 'dashboard' (Visão Diária) */}
                    {activeMenu === 'dashboard' && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionFlex}>
                                <div>
                                    <h2 className={styles.sectionTitle}>
                                        Fluxo de{' '}
                                        {format(
                                            new Date(`${selectedDate}T12:00:00`),
                                            "EEEE, dd 'de' MMMM",
                                            { locale: ptBR }
                                        )}
                                    </h2>
                                    <p className={styles.headerSubtitle}>
                                        Agendamentos programados para esta data.
                                    </p>
                                </div>

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(event) => setSelectedDate(event.target.value)}
                                    className={styles.dateInput}
                                />
                            </div>
                        </div>
                    )}

                    {/* Título simples para a aba de Todos os Agendamentos */}
                    {activeMenu === 'appointments' && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Todos os Agendamentos</h2>
                            <p className={styles.headerSubtitle}>Listagem geral de registros do sistema.</p>
                        </div>
                    )}

                    {/* BARRA DE FILTROS (Agora visível em ambas as abas de listagem) */}
                    <div className={styles.filtersGrid}>
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos os Status</option>
                            <option value="pending">Pendentes</option>
                            <option value="completed">Concluídos</option>
                            <option value="canceled">Cancelados</option>
                        </select>

                        <select
                            value={professionalFilter}
                            onChange={(e) => setProfessionalFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos os Profissionais</option>
                            {professionalsList.map((prof) => (
                                <option key={prof} value={prof}>
                                    {prof}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* LISTA PRINCIPAL (Renderiza o resultado filtrado) */}
                    <AppointmentList
                        appointments={filteredAppointments}
                        loading={loadingAppointments}
                        onStatusChange={handleStatusChange}
                    />
                </section>
            )}

            {/* =========================================================
                ABA DE CONFIGURAÇÕES (Caso queira implementar depois)
            ========================================================= */}
            {activeMenu === 'settings' && (
                <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Configurações da Empresa</h2>
                    {/* Seu formulário de configurações handleSaveSettings entra aqui */}
                </div>
            )}


        </div>
    );
}
