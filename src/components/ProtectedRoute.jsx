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

  // Esta validação melhora a navegação; a API continua sendo a autoridade de acesso.
  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to={`/${companySlug}`} replace />;
  }

  return children;
}
