// src/hooks/useAppointments.js

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { appointmentService } from '../services/appointmentService';

export default function useAppointments(company) {

    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );

    const [appointments, setAppointments] = useState([]);

    const [loadingAppointments, setLoadingAppointments] =
        useState(false);


    // Busca os agendamentos
    async function loadAppointments() {

        if (!company?._id) {
            return;
        }

        try {

            setLoadingAppointments(true);

            const response =
                await appointmentService.listAppointments(
                    company._id,
                    selectedDate
                );

            setAppointments(response.data);

        } catch (err) {

            console.error(
                'Erro ao buscar agendamentos:',
                err
            );

            setAppointments([]);

        } finally {

            setLoadingAppointments(false);

        }

    }


    // Executa a busca quando empresa ou data mudarem
    useEffect(() => {

        loadAppointments();

    }, [company, selectedDate]);


    // Altera o status
    async function handleStatusChange(
        appointmentId,
        newStatus
    ) {

        const statusLabel =
            newStatus === 'completed'
                ? 'concluído'
                : 'cancelado';


        if (
            !window.confirm(
                `Deseja realmente marcar este agendamento como ${statusLabel}?`
            )
        ) {
            return;
        }


        try {

            await appointmentService.updateStatus(
                appointmentId,
                company._id,
                newStatus
            );


            // Atualiza a lista após a alteração
            await loadAppointments();

        } catch (err) {

            alert(
                err.message ||
                'Erro ao atualizar o status.'
            );

        }

    }


    return {
        selectedDate,
        setSelectedDate,
        appointments,
        loadingAppointments,
        handleStatusChange
    };

}