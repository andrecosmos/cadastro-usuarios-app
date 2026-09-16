import AppointmentCard from './AppointmentCard';

// 1. IMPORTAR OS ESTILOS MODULE
import styles from './AppointmentList.module.css';

export default function AppointmentList({
    appointments,
    loading,
    onStatusChange
}) {

    if (loading) {
        return (
            <div className={styles.alertCard}>
                Carregando agendamentos...
            </div>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <div className={styles.alertCard}>
                Nenhum agendamento marcado para esta data.
            </div>
        );
    }

    return (
        <div className={styles.listGrid}>
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onStatusChange={onStatusChange}
                />
            ))}
        </div>
    );
}
