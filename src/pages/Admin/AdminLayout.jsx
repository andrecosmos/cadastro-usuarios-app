import { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';

import { appointmentService } from '../../services/appointmentService';

import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout() {

    const { companySlug } = useParams();

    const [company, setCompany] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');


    // Carrega a empresa pelo slug
    useEffect(() => {

        async function loadCompany() {

            try {

                setLoading(true);
                setError('');

                const response =
                    await appointmentService
                        .getCompanyBySlug(companySlug);

                setCompany(response.company);

            } catch (err) {

                setError(
                    err.message ||
                    'Empresa não encontrada.'
                );

            } finally {

                setLoading(false);

            }

        }

        if (companySlug) {
            loadCompany();
        }

    }, [companySlug]);


    if (loading) {

        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500 font-sans">
                Carregando painel...
            </div>
        );

    }


    if (error) {

        return (
            <div className="flex min-h-screen items-center justify-center text-red-500 font-sans p-4 text-center">
                ⚠️ {error}
            </div>
        );

    }


    return (

        <div className="flex min-h-screen bg-gray-100 font-sans">

            <AdminSidebar
                company={company}
            />

            <main className="flex-1 p-8 overflow-y-auto">

                <Outlet context={{ company }} />

            </main>

        </div>

    );
}