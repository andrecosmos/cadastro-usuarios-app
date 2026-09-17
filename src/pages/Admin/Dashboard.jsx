import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import styles from './Dashboard.module.css';

import { appointmentService } from '../../services/appointmentService';
import AppointmentList from '../../components/admin/AppointmentList';

export default function Dashboard() {

    const { company } = useOutletContext();

    /*
     * =========================================================
     * ESTADOS
     * =========================================================
     */

    const [activeMenu, setActiveMenu] = useState('dashboard');

    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );

    /*
     * Agendamentos da data selecionada.
     */
    const [dailyAppointments, setDailyAppointments] = useState([]);

    /*
     * Todos os agendamentos da empresa.
     */
    const [allAppointments, setAllAppointments] = useState([]);

    const [loadingDailyAppointments, setLoadingDailyAppointments] =
        useState(false);

    const [loadingAllAppointments, setLoadingAllAppointments] =
        useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');

    const [professionalFilter, setProfessionalFilter] =
        useState('all');

    const [configName, setConfigName] = useState('');

    const [configPhone, setConfigPhone] = useState('');

    const [isSavingConfig, setIsSavingConfig] = useState(false);


    /*
     * =========================================================
     * CONFIGURAÇÕES INICIAIS
     * =========================================================
     */

    useEffect(() => {

        if (!company) return;

        setConfigName(company.name || '');
        setConfigPhone(company.phone || '');

    }, [company]);


    /*
     * =========================================================
     * CARREGA AGENDAMENTOS DO DIA
     * =========================================================
     */

    const loadDailyAppointments = useCallback(async () => {

        if (!company?._id) return;

        try {

            setLoadingDailyAppointments(true);

            const response =
                await appointmentService.listAppointments(
                    company._id,
                    selectedDate
                );

            setDailyAppointments(
                response.data || []
            );

        } catch (error) {

            console.error(
                'Erro ao carregar agendamentos do dia:',
                error
            );

            setDailyAppointments([]);

        } finally {

            setLoadingDailyAppointments(false);

        }

    }, [
        company?._id,
        selectedDate
    ]);


    /*
     * =========================================================
     * CARREGA TODOS OS AGENDAMENTOS
     * =========================================================
     */

    const loadAllAppointments = useCallback(async () => {

        if (!company?._id) return;

        try {

            setLoadingAllAppointments(true);

            const response =
                await appointmentService.listAppointments(
                    company._id,
                    ''
                );

            setAllAppointments(
                response.data || []
            );

        } catch (error) {

            console.error(
                'Erro ao carregar todos os agendamentos:',
                error
            );

            setAllAppointments([]);

        } finally {

            setLoadingAllAppointments(false);

        }

    }, [
        company?._id
    ]);


    /*
     * =========================================================
     * CARREGAMENTO INICIAL DO DIA
     * =========================================================
     */

    useEffect(() => {

        if (!company?._id) return;

        loadDailyAppointments();

    }, [
        company?._id,
        selectedDate,
        loadDailyAppointments
    ]);


    /*
     * =========================================================
     * CARREGA TODOS OS AGENDAMENTOS AO ENTRAR NA ABA
     * =========================================================
     */

    useEffect(() => {

        if (!company?._id) return;

        if (activeMenu !== 'appointments') return;

        loadAllAppointments();

    }, [
        company?._id,
        activeMenu,
        loadAllAppointments
    ]);


    /*
     * =========================================================
     * STATUS DO AGENDAMENTO
     * =========================================================
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
                company._id,
                newStatus
            );

            /*
             * Atualiza a lista correta depois da alteração.
             */

            if (activeMenu === 'dashboard') {

                await loadDailyAppointments();

            } else if (activeMenu === 'appointments') {

                await loadAllAppointments();

            }

        } catch (error) {

            alert(
                error.message ||
                'Erro ao atualizar status.'
            );

        }

    }


    /*
     * =========================================================
     * CONFIGURAÇÕES DA EMPRESA
     * =========================================================
     */

    async function handleSaveSettings(event) {

        event.preventDefault();

        if (!company?._id) {

            alert('Empresa não carregada.');

            return;

        }

        try {

            setIsSavingConfig(true);

            await appointmentService.updateCompany(
                company._id,
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
     * =========================================================
     * AGENDAMENTOS ATUAIS
     * =========================================================
     *
     * Esta variável define qual conjunto de dados a tela
     * atualmente selecionada deve utilizar.
     */

    const currentAppointments =
        activeMenu === 'appointments'
            ? allAppointments
            : dailyAppointments;


    /*
     * =========================================================
     * LOADING ATUAL
     * =========================================================
     */

    const currentLoading =
        activeMenu === 'appointments'
            ? loadingAllAppointments
            : loadingDailyAppointments;


    /*
     * =========================================================
     * MÉTRICAS
     * =========================================================
     */

    const metrics = useMemo(() => {

        const total =
            currentAppointments.length;

        const completed =
            currentAppointments.filter(
                app => app.status === 'completed'
            ).length;

        const canceled =
            currentAppointments.filter(
                app => app.status === 'canceled'
            ).length;

        const pending =
            currentAppointments.filter(
                app => app.status === 'pending'
            ).length;

        return {
            total,
            completed,
            canceled,
            pending
        };

    }, [
        currentAppointments
    ]);


    /*
     * =========================================================
     * LISTA DE PROFISSIONAIS
     * =========================================================
     */

    const professionalsList = useMemo(() => {

        const names =
            currentAppointments
                .map(
                    app =>
                        app.professionalId?.name
                )
                .filter(Boolean);

        return [
            ...new Set(names)
        ];

    }, [
        currentAppointments
    ]);


    /*
     * =========================================================
     * FILTROS
     * =========================================================
     */

    const filteredAppointments = useMemo(() => {

        return currentAppointments.filter(app => {

            const customerName =
                app.customerId?.name?.toLowerCase() || '';

            const phone =
                app.customerId?.phone || '';

            const search =
                searchTerm.toLowerCase();

            const matchesSearch =
                customerName.includes(search) ||
                phone.includes(searchTerm);

            const matchesStatus =
                statusFilter === 'all' ||
                app.status === statusFilter;

            const matchesProfessional =
                professionalFilter === 'all' ||
                app.professionalId?.name ===
                    professionalFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesProfessional
            );

        });

    }, [
        currentAppointments,
        searchTerm,
        statusFilter,
        professionalFilter
    ]);


    /*
     * =========================================================
     * LOADING DA EMPRESA
     * =========================================================
     */

    if (!company) {

        return (
            <div className={styles.loadingContainer}>
                Carregando empresa...
            </div>
        );

    }


    /*
     * =========================================================
     * INTERFACE
     * =========================================================
     */

    return (

        <div className={styles.container}>

            {/* =================================================
                CABEÇALHO
            ================================================= */}

            <div>

                <h1 className={styles.headerTitle}>
                    Painel Administrativo
                </h1>

                <p className={styles.headerSubtitle}>
                    {company.name}
                </p>

            </div>


            {/* =================================================
                CARDS / MÉTRICAS
            ================================================= */}

            <div className={styles.metricsGrid}>

                <div className={styles.metricCard}>

                    <p className={styles.metricLabel}>
                        Total
                    </p>

                    <p
                        className={`${styles.metricValue} ${styles.textTotal}`}
                    >
                        {metrics.total}
                    </p>

                </div>


                <div className={styles.metricCard}>

                    <p
                        className={`${styles.metricLabel} ${styles.textPending}`}
                    >
                        Pendentes
                    </p>

                    <p
                        className={`${styles.metricValue} ${styles.textPending}`}
                    >
                        {metrics.pending}
                    </p>

                </div>


                <div className={styles.metricCard}>

                    <p
                        className={`${styles.metricLabel} ${styles.textCompleted}`}
                    >
                        Concluídos
                    </p>

                    <p
                        className={`${styles.metricValue} ${styles.textCompleted}`}
                    >
                        {metrics.completed}
                    </p>

                </div>


                <div className={styles.metricCard}>

                    <p
                        className={`${styles.metricLabel} ${styles.textCanceled}`}
                    >
                        Cancelados
                    </p>

                    <p
                        className={`${styles.metricValue} ${styles.textCanceled}`}
                    >
                        {metrics.canceled}
                    </p>

                </div>

            </div>


            {/* =================================================
                MENU
            ================================================= */}

            <div className={styles.menuContainer}>

                <div className={styles.menuFlex}>

                    <button
                        type="button"
                        onClick={() =>
                            setActiveMenu('dashboard')
                        }
                        className={`${styles.menuBtn} ${
                            activeMenu === 'dashboard'
                                ? styles.menuBtnActive
                                : styles.menuBtnInactive
                        }`}
                    >
                        📊 Visão Geral
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            setActiveMenu('appointments')
                        }
                        className={`${styles.menuBtn} ${
                            activeMenu === 'appointments'
                                ? styles.menuBtnActive
                                : styles.menuBtnInactive
                        }`}
                    >
                        📅 Todos os Agendamentos
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            setActiveMenu('settings')
                        }
                        className={`${styles.menuBtn} ${
                            activeMenu === 'settings'
                                ? styles.menuBtnActive
                                : styles.menuBtnInactive
                        }`}
                    >
                        ⚙️ Configurações
                    </button>

                </div>

            </div>


            {/* =================================================
                VISÃO GERAL
            ================================================= */}

            {activeMenu === 'dashboard' && (

                <section className={styles.sectionGrid}>

                    {/* FLUXO DO DIA */}

                    <div className={styles.sectionCard}>

                        <div className={styles.sectionFlex}>

                            <div>

                                <h2
                                    className={styles.sectionTitle}
                                >
                                    Fluxo de{' '}

                                    {format(
                                        new Date(
                                            `${selectedDate}T12:00:00`
                                        ),
                                        "EEEE, dd 'de' MMMM",
                                        {
                                            locale: ptBR
                                        }
                                    )}

                                </h2>

                                <p
                                    className={styles.headerSubtitle}
                                >
                                    Agendamentos programados para esta data.
                                </p>

                            </div>


                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) =>
                                    setSelectedDate(
                                        event.target.value
                                    )
                                }
                                className={styles.dateInput}
                            />

                        </div>

                    </div>


                    {/* FILTROS */}

                    <div className={styles.filtersGrid}>

                        <input
                            type="text"
                            placeholder="Buscar por cliente ou telefone..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            className={styles.searchInput}
                        />


                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className={styles.filterSelect}
                        >

                            <option value="all">
                                Todos os Status
                            </option>

                            <option value="pending">
                                Pendentes
                            </option>

                            <option value="completed">
                                Concluídos
                            </option>

                            <option value="canceled">
                                Cancelados
                            </option>

                        </select>


                        <select
                            value={professionalFilter}
                            onChange={(event) =>
                                setProfessionalFilter(
                                    event.target.value
                                )
                            }
                            className={styles.filterSelect}
                        >

                            <option value="all">
                                Todos os Profissionais
                            </option>

                            {professionalsList.map(
                                professional => (

                                    <option
                                        key={professional}
                                        value={professional}
                                    >
                                        {professional}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* LISTA */}

                    <AppointmentList
                        appointments={filteredAppointments}
                        loading={currentLoading}
                        onStatusChange={handleStatusChange}
                    />

                </section>

            )}


            {/* =================================================
                TODOS OS AGENDAMENTOS
            ================================================= */}

            {activeMenu === 'appointments' && (

                <section className={styles.sectionGrid}>

                    <div className={styles.sectionCard}>

                        <h2
                            className={styles.sectionTitle}
                        >
                            Todos os Agendamentos
                        </h2>

                        <p
                            className={styles.headerSubtitle}
                        >
                            Consulte e filtre os agendamentos da empresa.
                        </p>

                    </div>


                    {/* FILTROS */}

                    <div className={styles.filtersGrid}>

                        <input
                            type="text"
                            placeholder="Buscar por cliente ou telefone..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            className={styles.searchInput}
                        />


                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className={styles.filterSelect}
                        >

                            <option value="all">
                                Todos os Status
                            </option>

                            <option value="pending">
                                Pendentes
                            </option>

                            <option value="completed">
                                Concluídos
                            </option>

                            <option value="canceled">
                                Cancelados
                            </option>

                        </select>


                        <select
                            value={professionalFilter}
                            onChange={(event) =>
                                setProfessionalFilter(
                                    event.target.value
                                )
                            }
                            className={styles.filterSelect}
                        >

                            <option value="all">
                                Todos os Profissionais
                            </option>

                            {professionalsList.map(
                                professional => (

                                    <option
                                        key={professional}
                                        value={professional}
                                    >
                                        {professional}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* LISTA */}

                    <AppointmentList
                        appointments={filteredAppointments}
                        loading={currentLoading}
                        onStatusChange={handleStatusChange}
                    />

                </section>

            )}


            {/* =================================================
                CONFIGURAÇÕES
            ================================================= */}

            {activeMenu === 'settings' && (

                <section>

                    <div className={styles.settingsCard}>

                        <h2
                            className={styles.settingsTitle}
                        >
                            Configurações da Empresa
                        </h2>

                        <p
                            className={styles.settingsSubtitle}
                        >
                            Atualize os dados públicos do estabelecimento.
                        </p>


                        <form
                            onSubmit={handleSaveSettings}
                            className={styles.formContainer}
                        >

                            <div className={styles.formGroup}>

                                <label
                                    className={styles.formLabel}
                                >
                                    Nome do estabelecimento
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={configName}
                                    onChange={(event) =>
                                        setConfigName(
                                            event.target.value
                                        )
                                    }
                                    className={styles.formInput}
                                />

                            </div>


                            <div className={styles.formGroup}>

                                <label
                                    className={styles.formLabel}
                                >
                                    Telefone comercial
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={configPhone}
                                    onChange={(event) =>
                                        setConfigPhone(
                                            event.target.value
                                        )
                                    }
                                    className={styles.formInput}
                                />

                            </div>


                            <button
                                type="submit"
                                disabled={isSavingConfig}
                                className={styles.btnSubmit}
                            >

                                {isSavingConfig
                                    ? 'Salvando...'
                                    : 'Salvar Alterações'}

                            </button>

                        </form>

                    </div>

                </section>

            )}

        </div>

    );

}