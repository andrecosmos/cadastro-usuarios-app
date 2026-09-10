import { format } from 'date-fns';

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

            case 'confirmed':
                return 'Confirmado';

            case 'completed':
                return 'Concluído';

            case 'canceled':
                return 'Cancelado';

            default:
                return status;
        }

    }


    function getStatusClass() {

        switch (status) {

            case 'completed':
                return 'bg-green-100 text-green-700';

            case 'canceled':
                return 'bg-red-100 text-red-700';

            default:
                return 'bg-yellow-100 text-yellow-700';

        }

    }


    return (

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-300">

            {/* Horário + informações */}
            <div className="flex items-start gap-4">

                {/* Horário */}
                <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-2 rounded-xl text-center min-w-[75px]">

                    <span className="text-sm block">
                        {format(
                            new Date(startTime),
                            'HH:mm'
                        )}
                    </span>

                    <span className="text-xs text-indigo-400 font-normal">
                        até{' '}

                        {format(
                            new Date(endTime),
                            'HH:mm'
                        )}
                    </span>

                </div>


                {/* Cliente */}
                <div>

                    <h3 className="font-semibold text-gray-800">
                        {customerId?.name || 'Cliente'}
                    </h3>

                    <p className="text-xs text-gray-500">
                        📞 {customerId?.phone || 'Telefone não informado'}
                    </p>


                    {/* Serviço e profissional */}
                    <div className="mt-2 flex flex-wrap gap-2">

                        <span className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                            🛠️ {serviceId?.name || 'Serviço'}
                        </span>

                        <span className="bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                            👤 Profissional:{' '}
                            {professionalId?.name || 'Não informado'}
                        </span>

                    </div>

                </div>

            </div>


            {/* Status + ações */}
            <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">

                {/* Status */}
                <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusClass()}`}
                >
                    {getStatusLabel()}
                </span>


                {/* Ações */}
                {status === 'confirmed' && (

                    <div className="flex gap-1.5">

                        <button
                            onClick={() =>
                                onStatusChange(
                                    _id,
                                    'completed'
                                )
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-2 rounded-xl transition-all"
                        >
                            Concluir
                        </button>


                        <button
                            onClick={() =>
                                onStatusChange(
                                    _id,
                                    'canceled'
                                )
                            }
                            className="bg-white border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
                        >
                            Cancelar
                        </button>

                    </div>

                )}

            </div>

        </div>

    );
}