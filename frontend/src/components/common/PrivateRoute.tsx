import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.ts';
import type { Rol } from '../../types/index.ts';

interface Props {
  children: React.ReactNode;
  roles?: Rol[];
}

export default function PrivateRoute({ children, roles }: Props) {
  const { usuario, accessToken } = useAuthStore();

  if (!accessToken || !usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
