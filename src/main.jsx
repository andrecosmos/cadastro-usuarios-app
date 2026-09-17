import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import App from './App.jsx';

import AdminLayout
  from './pages/Admin/AdminLayout.jsx';

import Dashboard
  from './pages/Admin/Dashboard.jsx';

import CadastroEmpresa
  from './pages/Admin/empresa/CadastroEmpresa.jsx';

import CadastroCliente
  from './pages/Admin/cliente/CadastroCliente.jsx';

import CadastroProfissional
  from './pages/Admin/profissional/CadastroProfissional.jsx';

import CadastroServico
  from './pages/Admin/servico/CadastroServico.jsx';

import './index.css';



import HomePlataforma from './pages/HomePlataforma.jsx';



ReactDOM.createRoot(
  document.getElementById('root')
).render(

  <React.StrictMode>

    <BrowserRouter>

      <Routes>

        {/* =====================================
            ÁREA DO CLIENTE
        ====================================== */}

        <Route
          path="/:companySlug"
          element={<App />}
        />


        {/* =====================================
            CADASTRO DE EMPRESA
        ====================================== */}

        <Route
          path="/empresa/nova"
          element={<CadastroEmpresa />}
        />


        {/* =====================================
            ÁREA ADMINISTRATIVA
        ====================================== */}

        <Route
          path="/:companySlug/admin"
          element={<AdminLayout/>}
        >

          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="servicos/novo"
            element={<CadastroServico />}
          />

          <Route
            path="clientes/novo"
            element={<CadastroCliente />}
          />

          <Route
            path="profissionais/novo"
            element={<CadastroProfissional />}
          />

        </Route>


        {/* =====================================
            HOME
        ====================================== */}

        <Route
          path="/"
          element={
            <HomePlataforma/>
          }
        />

        

      </Routes>

    </BrowserRouter>

  </React.StrictMode>
);