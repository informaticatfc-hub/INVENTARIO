import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import esES from 'antd/locale/es_ES';
import AppLayout       from './components/layout/AppLayout.tsx';
import PrivateRoute    from './components/common/PrivateRoute.tsx';
import Login           from './pages/auth/Login.tsx';
import Dashboard       from './pages/dashboard/Dashboard.tsx';
import AlmacenesList   from './pages/almacenes/AlmacenesList.tsx';
import AlmacenDetail   from './pages/almacenes/AlmacenDetail.tsx';
import MaterialesList  from './pages/materiales/MaterialesList.tsx';
import EntradasList    from './pages/entradas/EntradasList.tsx';
import EntradaForm     from './pages/entradas/EntradaForm.tsx';
import SalidasList     from './pages/salidas/SalidasList.tsx';
import SalidaForm      from './pages/salidas/SalidaForm.tsx';
import Transferencias  from './pages/transferencias/Transferencias.tsx';
import Perdidas        from './pages/perdidas/Perdidas.tsx';
import Reportes        from './pages/reportes/Reportes.tsx';

export default function App() {
  return (
    <ConfigProvider locale={esES} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index                 element={<Dashboard />} />
              <Route path="almacenes"      element={<AlmacenesList />} />
              <Route path="almacenes/:id"  element={<AlmacenDetail />} />
              <Route path="materiales"     element={<MaterialesList />} />
              <Route path="entradas"       element={<EntradasList />} />
              <Route path="entradas/nueva" element={<EntradaForm />} />
              <Route path="salidas"        element={<SalidasList />} />
              <Route path="salidas/nueva"  element={<SalidaForm />} />
              <Route path="transferencias" element={<Transferencias />} />
              <Route path="perdidas"       element={<Perdidas />} />
              <Route path="reportes"       element={<Reportes />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
