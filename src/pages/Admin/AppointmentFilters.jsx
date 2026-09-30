import styles from './Dashboard.module.css';

export default function AppointmentFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    professionalFilter,
    onProfessionalChange,
    professionals
}) {
    return (
        <div className={styles.filtersGrid}>
            <input
                type="search"
                placeholder="Buscar por cliente ou telefone..."
                aria-label="Buscar agendamentos por cliente ou telefone"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                className={styles.searchInput}
            />

            <select
                aria-label="Filtrar agendamentos por status"
                value={statusFilter}
                onChange={(event) => onStatusChange(event.target.value)}
                className={styles.filterSelect}
            >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídos</option>
                <option value="canceled">Cancelados</option>
            </select>

            <select
                aria-label="Filtrar agendamentos por profissional"
                value={professionalFilter}
                onChange={(event) => onProfessionalChange(event.target.value)}
                className={styles.filterSelect}
            >
                <option value="all">Todos os Profissionais</option>
                {professionals.map((professional) => (
                    <option key={professional} value={professional}>
                        {professional}
                    </option>
                ))}
            </select>
        </div>
    );
}