import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import styles from './Dashboard.module.css';

import { appointmentService } from '../../services/appointmentService';
import AppointmentList from '../../components/admin/AppointmentList';
import AppointmentFilters from './AppointmentFilters';
import CompanySettings from './CompanySettings';

export default function Dashboard() {

    const { company, updateCompany } = useOutletContext();

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
        useState(true);

    const [loadingAllAppointments, setLoadingAllAppointments] =
        useState(false);

    const [hasLoadedAllAppointments, setHasLoadedAllAppointments] =
        useState(false);

    const [dailyAppointmentsError, setDailyAppointmentsError] = useState('');

    const [allAppointmentsError, setAllAppointmentsError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');

    const [professionalFilter, setProfessionalFilter] =
        useState('all');

    const companyId = company?._id;
    const [refreshVersion, setRefreshVersion] = useState(0);
    const today = new Date();
    const [reportFrom, setReportFrom] = useState(
        format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')
    );
    const [reportTo, setReportTo] = useState(format(today, 'yyyy-MM-dd'));
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');

    useEffect(() => {
        if (!companyId || activeMenu !== 'reports') return;

        let isCurrentRequest = true;
        appointmentService.getReportSummary(companyId, reportFrom, reportTo)
            .then((response) => {
                if (isCurrentRequest) setReportData(response.data);
            })
            .catch((error) => {
                if (!isCurrentRequest) return;
                setReportData(null);
                setReportError(error.message || 'Erro ao carregar os relatórios.');
            })
            .finally(() => {
                if (isCurrentRequest) setReportLoading(false);
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [companyId, activeMenu, reportFrom, reportTo, refreshVersion]);

    useEffect(() => {
        if (!companyId || activeMenu !== 'dashboard') return;

        let isCurrentRequest = true;

        appointmentService.listAppointments(companyId, selectedDate)
            .then((response) => {
                if (!isCurrentRequest) return;
                setDailyAppointments(response.data || []);
                setDailyAppointmentsError('');
            })
            .catch((error) => {
                if (!isCurrentRequest) return;
                setDailyAppointmentsError(
                    error.message || 'Erro ao carregar agendamentos do dia.'
                );
                setDailyAppointments([]);
            })
            .finally(() => {
                if (isCurrentRequest) setLoadingDailyAppointments(false);
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [companyId, selectedDate, activeMenu, refreshVersion]);

    useEffect(() => {
        if (!companyId || activeMenu !== 'appointments') return;

        let isCurrentRequest = true;

        appointmentService.listAppointments(companyId, '')
            .then((response) => {
                if (!isCurrentRequest) return;
                setAllAppointments(response.data || []);
                setAllAppointmentsError('');
            })
            .catch((error) => {
                if (!isCurrentRequest) return;
                setAllAppointmentsError(
                    error.message || 'Erro ao carregar todos os agendamentos.'
                );
                setAllAppointments([]);
            })
            .finally(() => {
                if (isCurrentRequest) {
                    setLoadingAllAppointments(false);
                    setHasLoadedAllAppointments(true);
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [companyId, activeMenu, refreshVersion]);


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
                companyId,
                newStatus
            );

            if (activeMenu === 'dashboard') {
                setLoadingDailyAppointments(true);
                setDailyAppointmentsError('');
            } else if (activeMenu === 'appointments') {
                setLoadingAllAppointments(true);
                setAllAppointmentsError('');
            }

            setRefreshVersion((version) => version + 1);

        } catch (error) {

            alert(
                error.message ||
                'Erro ao atualizar status.'
            );

        }

    }

    async function handleRegisterPayment(appointmentId, method) {
        try {
            await appointmentService.recordAppointmentPayment(appointmentId, method);
            setRefreshVersion((version) => version + 1);
        } catch (error) {
            alert(error.message || 'Erro ao registrar pagamento.');
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
            ? loadingAllAppointments || !hasLoadedAllAppointments
            : loadingDailyAppointments;

    const currentError =
        activeMenu === 'appointments'
            ? allAppointmentsError
            : dailyAppointmentsError;


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
                app.customerId?.nome?.toLowerCase() || '';

            const phone =
                app.customerId?.telefone || '';

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

            {activeMenu !== 'reports' && <div className={styles.metricsGrid}>
                {[
                    { key: 'total', label: 'Total', value: metrics.total, tone: styles.textTotal },
                    { key: 'pending', label: 'Pendentes', value: metrics.pending, tone: styles.textPending },
                    { key: 'completed', label: 'Concluídos', value: metrics.completed, tone: styles.textCompleted },
                    { key: 'canceled', label: 'Cancelados', value: metrics.canceled, tone: styles.textCanceled }
                ].map((metric) => (
                    <div className={styles.metricCard} key={metric.key}>
                        <p className={`${styles.metricLabel} ${metric.tone}`}>
                            {metric.label}
                        </p>
                        <p className={`${styles.metricValue} ${metric.tone}`}>
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>}


            {/* =================================================
                MENU
            ================================================= */}

            <div className={styles.menuContainer}>

                <div className={styles.menuFlex}>

                    <button
                        type="button"
                        onClick={() => {
                            setLoadingDailyAppointments(true);
                            setDailyAppointmentsError('');
                            setActiveMenu('dashboard')
                        }}
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
                        onClick={() => {
                            setReportLoading(true);
                            setReportError('');
                            setActiveMenu('reports');
                        }}
                        className={`${styles.menuBtn} ${
                            activeMenu === 'reports'
                                ? styles.menuBtnActive
                                : styles.menuBtnInactive
                        }`}
                    >
                        📈 Relatórios
                    </button>


                    <button
                        type="button"
                        onClick={() => {
                            setLoadingAllAppointments(true);
                            setAllAppointmentsError('');
                            setActiveMenu('appointments')
                        }}
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
                                onChange={(event) => {
                                    setLoadingDailyAppointments(true);
                                    setDailyAppointmentsError('');
                                    setSelectedDate(event.target.value);
                                }}
                                className={styles.dateInput}
                            />

                        </div>

                    </div>


                    <AppointmentFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        professionalFilter={professionalFilter}
                        onProfessionalChange={setProfessionalFilter}
                        professionals={professionalsList}
                    />


                    {/* LISTA */}

                    <AppointmentList
                        appointments={filteredAppointments}
                        loading={currentLoading}
                        error={currentError}
                        onStatusChange={handleStatusChange}
                        onRegisterPayment={handleRegisterPayment}
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


                    <AppointmentFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        professionalFilter={professionalFilter}
                        onProfessionalChange={setProfessionalFilter}
                        professionals={professionalsList}
                    />


                    {/* LISTA */}

                    <AppointmentList
                        appointments={filteredAppointments}
                        loading={currentLoading}
                        error={currentError}
                        onStatusChange={handleStatusChange}
                        onRegisterPayment={handleRegisterPayment}
                    />

                </section>

            )}

            {activeMenu === 'reports' && (
                <section className={styles.sectionGrid}>
                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Relatórios de agendamentos e pagamentos</h2>
                        <p className={styles.headerSubtitle}>
                            Os status consideram agendamentos criados no período; faturamento considera pagamentos recebidos no período.
                        </p>
                        <div className={styles.reportFilters}>
                            <label>
                                De
                                <input
                                    type="date"
                                    value={reportFrom}
                                    onChange={(event) => {
                                        setReportLoading(true);
                                        setReportError('');
                                        setReportFrom(event.target.value);
                                    }}
                                    className={styles.dateInput}
                                />
                            </label>
                            <label>
                                Até
                                <input
                                    type="date"
                                    value={reportTo}
                                    onChange={(event) => {
                                        setReportLoading(true);
                                        setReportError('');
                                        setReportTo(event.target.value);
                                    }}
                                    className={styles.dateInput}
                                />
                            </label>
                        </div>
                    </div>

                    {reportLoading ? (
                        <div className={styles.sectionCard}>Carregando relatórios...</div>
                    ) : reportError ? (
                        <div className={styles.sectionCard} role="alert">{reportError}</div>
                    ) : reportData ? (
                        <>
                            <div className={styles.reportMetricsGrid}>
                                {[
                                    { key: 'created', label: 'Criados', value: reportData.appointments.created, tone: styles.textTotal },
                                    { key: 'confirmed', label: 'Confirmados', value: reportData.appointments.confirmed, tone: styles.textPending },
                                    { key: 'completed', label: 'Concluídos', value: reportData.appointments.completed, tone: styles.textCompleted },
                                    { key: 'canceled', label: 'Cancelados', value: reportData.appointments.canceled, tone: styles.textCanceled },
                                    { key: 'cancellationRate', label: 'Taxa de cancelamento', value: `${(reportData.appointments.cancellationRate * 100).toFixed(1)}%`, tone: styles.textCanceled },
                                    { key: 'attendanceRate', label: 'Comparecimento*', value: `${(reportData.appointments.attendanceRate * 100).toFixed(1)}%`, tone: styles.textCompleted }
                                ].map((metric) => (
                                    <div className={styles.metricCard} key={metric.key}>
                                        <p className={`${styles.metricLabel} ${metric.tone}`}>{metric.label}</p>
                                        <p className={`${styles.metricValue} ${metric.tone}`}>{metric.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Pagamentos recebidos</h3>
                                <p className={styles.revenueTotal}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                                        .format(reportData.payments.receivedAmount)}
                                </p>
                                <p className={styles.headerSubtitle}>
                                    {reportData.payments.receivedCount} pagamento(s) registrado(s).
                                </p>
                                <div className={styles.paymentBreakdown}>
                                    {[
                                        ['mercado_pago', 'Online (Mercado Pago)'],
                                        ['pix', 'Pix no estabelecimento'],
                                        ['cash', 'Dinheiro'],
                                        ['card', 'Cartão no estabelecimento'],
                                        ['unknown', 'Método não identificado']
                                    ].map(([method, label]) => {
                                        const payment = reportData.payments.byMethod.find((item) => item.method === method);
                                        if (!payment) return null;
                                        return (
                                            <div className={styles.paymentBreakdownRow} key={method}>
                                                <span>{label} ({payment.count})</span>
                                                <strong>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                                                        .format(payment.amount)}
                                                </strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className={styles.reportNote}>
                                * Comparecimento = concluídos / concluídos e confirmados já vencidos. Agendamentos futuros não entram no cálculo.
                            </p>
                        </>
                    ) : null}
                </section>
            )}


            {/* =================================================
                CONFIGURAÇÕES
            ================================================= */}

            {activeMenu === 'settings' && (
                <CompanySettings company={company} onUpdated={updateCompany} />
            )}

        </div>

    );

}