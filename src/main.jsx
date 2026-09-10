import React from 'react';
import ReactDOM from 'react-dom/client';

import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import App from './App.jsx';

import AdminLayout from './pages/Admin/AdminLayout.jsx';
import Dashboard from './pages/Admin/Dashboard.jsx';

import './index.css';

ReactDOM.createRoot(
    document.getElementById('root')
).render(

    <React.StrictMode>

        <BrowserRouter>

            <Routes>

                {/* Cliente */}
                <Route
                    path="/:companySlug"
                    element={<App />}
                />

                {/* Área administrativa */}
                <Route
                    path="/:companySlug/admin"
                    element={<AdminLayout />}
                >

                    {/* /:companySlug/admin */}
                    <Route
                        index
                        element={<Dashboard />}
                    />

                </Route>


                {/* Página inicial */}
                <Route
                    path="/"
                    element={
                        <div className="flex min-h-screen items-center justify-center font-sans text-gray-500">
                            Bem-vindo! Acesse através da URL de um estabelecimento parceiro.
                        </div>
                    }
                />

            </Routes>

        </BrowserRouter>

    </React.StrictMode>
);