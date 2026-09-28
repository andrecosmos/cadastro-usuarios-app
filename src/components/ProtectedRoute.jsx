import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, roleRequired }) {
  const { user, signed, loading } = useAuth();
  const { companySlug } = useParams();

  if (loading) {
    return <div>Carregando painel...</div>;
  }

  // 1. Se não estiver logado de verdade, manda para o login
  if (!signed) {
    return <Navigate to={`/${companySlug || 'admin'}/login`} replace />;
  }

  // 🌟 Trava de Segurança Crítica (Multitenancy):
  // Impede que um Admin ou usuário de uma empresa acesse o painel administrativo de outra empresa via URL
  if (user?.companyId && children.props?.context?.company?._id) {
    const currentRouteCompanyId = children.props.context.company._id;
    if (user.companyId !== currentRouteCompanyId) {
      console.warn("Acesso bloqueado: Usuário pertence a outra empresa.");
      return <Navigate to={`/${companySlug}/login`} replace />;
    }
  }

  // 2. Validação da permissão/role (Admin vs User)
  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to={`/${companySlug}`} replace />;
  }

  return children;
}
