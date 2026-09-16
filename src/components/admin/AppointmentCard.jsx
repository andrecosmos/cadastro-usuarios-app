import { format } from 'date-fns';

// 1. IMPORTAR OS ESTILOS MODULE
import styles from './AppointmentCard.module.css';

export default function AppointmentCard({
    appointment,
    onStatusChange
}) {

    const {
        _id,
        startTime,
        endTime,
        customerId,
        serviceId,
        professionalId,
        status
    } = appointment;

    function getStatusLabel() {
        switch (status) {
            case 'confirmed': return 'Confirmado';
            case 'completed': return 'Concluído';
            case 'canceled': return 'Cancelado';
            default: return status;
        }
    }

    /* MODIFICADO: Retorna a classe correspondente mapeada no CSS Modules */
    function getStatusClass() {
        switch (status) {
            case 'completed':
                return styles.statusCompleted;
            case 'canceled':
                return styles.statusCanceled;
            default:
                return styles.statusPending;
        }
    }

    return (
        <div className={styles.cardContainer}>

            {/* Horário + informações */}
            <div className={styles.infoSection}>

                {/* Horário */}
                <div className={styles.timeBlock}>
                    <span className={styles.timeMain}>
                        {format(new Date(startTime), 'HH:mm')}
                    </span>
                    <span className={styles.timeSub}>
                        até {format(new Date(endTime), 'HH:mm')}
                    </span>
                </div>

                {/* Cliente */}
                <div>
                    <h3 className={styles.customerName}>
                        {customerId?.name || 'Cliente'}
                    </h3>
                    <p className={styles.customerPhone}>
                        📞 {customerId?.phone || 'Telefone não informado'}
                    </p>

                    {/* Serviço e profissional */}
                    <div className={styles.tagsContainer}>
                        <span className={styles.tagService}>
                            🛠️ {serviceId?.name || 'Serviço'}
                        </span>
                        <span className={styles.tagProfessional}>
                            👤 Profissional: {professionalId?.name || 'Não informado'}
                        </span>
                    </div>
                </div>

            </div>

            {/* Status + ações */}
            <div className={styles.actionSection}>
                
                {/* Status com classe dinâmica */}
                <span className={`${styles.statusBadge} ${getStatusClass()}`}>
                    {getStatusLabel()}
                </span>

                {/* Ações */}
                {['pending', 'confirmed'].includes(status) && (
                    <div className={styles.actionGroup}>
                        <button
                            type="button"
                            onClick={() => onStatusChange(_id, 'completed')}
                            className={styles.btnConfirm}
                        >
                            Concluir
                        </button>

                        <button
                            type="button"
                            onClick={() => onStatusChange(_id, 'canceled')}
                            className={styles.btnCancel}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

            </div>

        </div>
    );
}
