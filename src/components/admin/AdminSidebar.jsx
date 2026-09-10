import { NavLink, useParams } from 'react-router-dom';

export default function AdminSidebar({ company }) {

    const { companySlug } = useParams();

    const menuItems = [
        {
            label: 'Visão Geral da Agenda',
            path: `/` + companySlug + `/admin`,
            icon: '📊',
            end: true
        },
        {
            label: 'Cadastrar Serviço',
            path: `/` + companySlug + `/admin/servicos`,
            icon: '🛠️'
        },
        {
            label: 'Cadastrar Profissional',
            path: `/` + companySlug + `/admin/profissionais`,
            icon: '👥'
        }
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800">

            {/* Cabeçalho da empresa */}
            <div className="p-5 border-b border-slate-800 bg-slate-950">

                <h1 className="text-md font-bold text-white truncate">
                    {company?.name}
                </h1>

                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">
                    Painel Admin
                </span>

            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-1.5">

                {menuItems.map((item) => (

                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`
                        }
                    >

                        <span>
                            {item.icon}
                        </span>

                        <span>
                            {item.label}
                        </span>

                    </NavLink>

                ))}

            </nav>

            {/* Rodapé */}
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                v1.0.0 - SaaS Agendamentos
            </div>

        </aside>
    );
}