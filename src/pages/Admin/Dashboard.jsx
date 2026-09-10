// src/pages/Admin/Dashboard.jsx

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOutletContext } from 'react-router-dom';

import useAppointments from '../../hooks/useAppointments';

import AppointmentList
    from '../../components/admin/AppointmentList';


export default function Dashboard() {

    const { company } = useOutletContext();


    const {
        selectedDate,
        setSelectedDate,
        appointments,
        loadingAppointments,
        handleStatusChange
    } = useAppointments(company);


    const dateFormatted = format(
        new Date(selectedDate + 'T12:00:00'),
        "EEEE, dd 'de' MMMM",
        {
            locale: ptBR
        }
    );


    return (

        <div>

            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">

                <div>

                    <h2 className="text-lg font-bold text-gray-800 capitalize">
                        Fluxo de {dateFormatted}
                    </h2>

                    <p className="text-xs text-gray-500">
                        Monitore os atendimentos marcados para este dia
                    </p>

                </div>


                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                        setSelectedDate(e.target.value)
                    }
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 font-medium"
                />

            </div>


            {/* Lista */}
            <AppointmentList
                appointments={appointments}
                loading={loadingAppointments}
                onStatusChange={handleStatusChange}
            />

        </div>

    );

}