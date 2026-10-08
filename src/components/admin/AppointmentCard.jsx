import { useState } from 'react';
import { formatBusinessDate, formatBusinessTime } from '../../../shared/dateTime.js';

// 1. IMPORTAR OS ESTILOS MODULE
import styles from './AppointmentCard.module.css';

export default function AppointmentCard({
    appointment,
    onStatusChange,
    onRegisterPayment
}) {
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);

    const {
        _id,
        startTime,
        endTime,
        customerId,
        serviceId,
        serviceIds,
        professionalId,
        status,
        paymentStatus,
        paymentMethod: recordedPaymentMethod,
        paymentReceivedAt,
        paymentReceivedAmount,
        paymentAmount
    } = appointment;
    const amountToReceive = Number(paymentAmount ?? serviceId?.price ?? 0);
    const serviceNames = serviceIds?.length
        ? serviceIds.map((service) => service?.name).filter(Boolean).join(', ')
        : serviceId?.name;

    async function handleRegisterPayment(event) {
        event.preventDefault();
        const methodLabel = {
            pix: 'Pix',
            cash: 'dinheiro',
            card: 'cartão'
        }[paymentMethod];
        const amountLabel = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: appointment.paymentCurrency || 'BRL'
        }).format(amountToReceive);

        if (!window.confirm(`Confirmar recebimento de ${amountLabel} em ${methodLabel}?`)) return;

        try {
            setIsRegisteringPayment(true);
            await onRegisterPayment(_id, paymentMethod);
        } finally {
            setIsRegisteringPayment(false);
        }
    }

    function getPaymentMethodLabel(method) {
        return {
            mercado_pago: 'Online (Mercado Pago)',
            pix: 'Pix',
            cash: 'Dinheiro',
            card: 'Cartão'
        }[method] || 'Não informado';
    }

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
                    <span className={styles.timeSub}>
                        {formatBusinessDate(startTime)}
                    </span>
                    <span className={styles.timeMain}>
                        {formatBusinessTime(startTime)}
                    </span>
                    <span className={styles.timeSub}>
                        até {formatBusinessTime(endTime)}
                    </span>
                </div>

                {/* Cliente */}
                <div>
                    <h3 className={styles.customerName}>
                        {customerId?.nome || 'Cliente'}
                    </h3>
                    <p className={styles.customerPhone}>
                        📞 {customerId?.telefone || 'Telefone não informado'}
                    </p>

                    {/* Serviço e profissional */}
                    <div className={styles.tagsContainer}>
                        <span className={styles.tagService}>
                            🛠️ {serviceNames || 'Serviço'}
                        </span>
                        <span className={styles.tagProfessional}>
                            👤 Profissional: {professionalId?.name || 'Não informado'}
                        </span>
                    </div>
                    {paymentStatus === 'paid' ? (
                        <p className={styles.paymentInfo}>
                            Pago {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: appointment.paymentCurrency || 'BRL'
                            }).format(paymentReceivedAmount ?? paymentAmount ?? serviceId?.price ?? 0)}
                            {' · '}{getPaymentMethodLabel(recordedPaymentMethod)}
                            {paymentReceivedAt && ` · ${formatBusinessDate(paymentReceivedAt)}`}
                        </p>
                    ) : (
                        <p className={styles.paymentInfo}>
                            Pagamento pendente · {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: appointment.paymentCurrency || 'BRL'
                            }).format(amountToReceive || 0)}
                        </p>
                    )}
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

                {paymentStatus !== 'paid' && !['canceled'].includes(status) && (
                    <form className={styles.paymentForm} onSubmit={handleRegisterPayment}>
                        <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value)}
                            aria-label="Método de pagamento recebido"
                            disabled={isRegisteringPayment}
                        >
                            <option value="pix">Pix</option>
                            <option value="cash">Dinheiro</option>
                            <option value="card">Cartão</option>
                        </select>
                        <button type="submit" className={styles.btnPayment} disabled={isRegisteringPayment}>
                            {isRegisteringPayment ? 'Registrando...' : 'Registrar pagamento'}
                        </button>
                    </form>
                )}

            </div>

        </div>
    );
}
