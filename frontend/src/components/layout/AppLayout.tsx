import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined, DatabaseOutlined, ShopOutlined,
  ImportOutlined, ExportOutlined, SwapOutlined,
  WarningOutlined, BarChartOutlined, UserOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore.ts';
import { authService } from '../../services/auth.service.ts';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ROL_COLOR: Record<string, string> = {
  ADMIN: 'red', ALMACENISTA: 'blue', SUPERVISOR: 'green', SOLO_LECTURA: 'default',
};

const menuItems = [
  { key: '/',              icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/almacenes',     icon: <ShopOutlined />,      label: 'Almacenes' },
  { key: '/materiales',    icon: <DatabaseOutlined />,  label: 'Materiales' },
  { key: '/entradas',      icon: <ImportOutlined />,    label: 'Entradas' },
  { key: '/salidas',       icon: <ExportOutlined />,    label: 'Salidas' },
  { key: '/transferencias',icon: <SwapOutlined />,      label: 'Transferencias' },
  { key: '/perdidas',      icon: <WarningOutlined />,   label: 'Pérdidas' },
  { key: '/reportes',      icon: <BarChartOutlined />,  label: 'Reportes' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const { usuario, refreshToken, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authService.logout(refreshToken!); } catch { /* continuar */ }
    clearAuth();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión', danger: true },
    ],
    onClick: handleLogout,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#001529' }}
      >
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: collapsed ? 14 : 16, margin: '8px 0', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'INV' : 'Sistema Inventario'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
          <span style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <Text strong style={{ fontSize: 13 }}>{usuario?.nombre}</Text>
              <Tag color={ROL_COLOR[usuario?.rol ?? ''] ?? 'default'} style={{ margin: 0, fontSize: 11 }}>
                {usuario?.rol?.replace('_', ' ')}
              </Tag>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
