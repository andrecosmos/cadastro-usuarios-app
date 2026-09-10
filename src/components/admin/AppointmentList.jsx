import AppointmentCard from './AppointmentCard';

export default function AppointmentList({
    appointments,
    loading,
    onStatusChange
}) {

    if (loading) {

        return (

            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">

                Carregando agendamentos...

            </div>

        );

    }


    if (!appointments || appointments.length === 0) {

        return (

            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">

                Nenhum agendamento marcado para esta data.

            </div>

        );

    }


    return (

        <div className="grid gap-4">

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