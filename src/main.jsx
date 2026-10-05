import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import Dashboard from './pages/Admin/Dashboard.jsx';
import CadastroEmpresa from './pages/Admin/empresa/CadastroEmpresa.jsx';
import CadastroCliente from './pages/Admin/cliente/CadastroCliente.jsx';
import CadastroProfissional from './pages/Admin/profissional/CadastroProfissional.jsx';
import CadastroServico from './pages/Admin/servico/CadastroServico.jsx';
import CriarAgendamento from './pages/Admin/agendamento/CriarAgendamento.jsx';
import HomePlataforma from './pages/HomePlataforma.jsx';
import LoginCentral from './pages/LoginCentral.jsx'; // Importa a nova página de login centralizada
//  página  de Login em src/pages/Login.jsx
import Login from './pages/Login.jsx'; 
import CadastroUsuario from './pages/CadastroUsuario.jsx';

import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import './index.css';
import MinhaConta from './pages/MinhaConta.jsx'; // Importa a página de Minha Conta

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota da Home da plataforma */}
          <Route path="/" element={<HomePlataforma />} />

         
          
          {/* Rota para tela de login com o slug da empresa */}
          <Route path="/empresa/login" element={<LoginCentral/>} /> 
          <Route path="/:companySlug/login" element={<Login />} />
          <Route path="/:companySlug/cadastro" element={<CadastroUsuario />} />

          <Route path="/:companySlug/minha-conta" element={<MinhaConta />} />
          
          {/* Rota de cadastro de nova empresa */}
          <Route path="/empresa/nova" element={<CadastroEmpresa />} />

          {/* Rota pública do cliente para agendamentos */}
          <Route path="/:companySlug" element={<App />} />

          {/* Área administrativa TOTALMENTE PROTEGIDA */}
          <Route
            path="/:companySlug/admin"
            element={
              <ProtectedRoute roleRequired="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="servicos/novo" element={<CadastroServico />} />
            <Route path="clientes/novo" element={<CadastroCliente />} />
            <Route path="profissionais/novo" element={<CadastroProfissional />} />
            <Route path="agendamentos/novo" element={<CriarAgendamento />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
