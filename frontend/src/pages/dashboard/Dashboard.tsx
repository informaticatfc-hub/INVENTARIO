import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd';
import { ShopOutlined, ImportOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons';
import { dashboardService, entradasService, salidasService } from '../../services/movimientos.service.ts';

const { Title } = Typography;

export default function Dashboard() {
  const [stats,    setStats]   = useState<any>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [salidas,  setSalidas]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.general(),
      entradasService.listar({ pageSize: 5 }),
      salidasService.listar({ pageSize: 5 }),
    ]).then(([s, e, sa]) => {
      setStats(s);
      setEntradas(e.data);
      setSalidas(sa.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 80 }}><Spin size="large" /></div>;

  return (
    <>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Almacenes activos"   value={stats?.almacenesActivos ?? 0}    prefix={<ShopOutlined />}   valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Entradas hoy"         value={stats?.entradasHoy ?? 0}          prefix={<ImportOutlined />}  valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Salidas pendientes"   value={stats?.salidasPendientes ?? 0}    prefix={<ExportOutlined />}  valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Materiales bajo mínimo" value={stats?.materialesBajoMinimo ?? 0} prefix={<WarningOutlined />} valueStyle={{ color: stats?.materialesBajoMinimo > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Últimas entradas" size="small">
            <Table
              dataSource={entradas}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Folio',    dataIndex: 'folio',    key: 'folio' },
                { title: 'Almacén', dataIndex: ['almacen', 'nombre'], key: 'almacen' },
                { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor', ellipsis: true },
                { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', render: (v: string) => new Date(v).toLocaleDateString('es-MX') },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Últimas salidas" size="small">
            <Table
              dataSource={salidas}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Folio',   dataIndex: 'folio', key: 'folio' },
                { title: 'Almacén', dataIndex: ['almacen', 'nombre'], key: 'almacen' },
                { title: 'Estado',  dataIndex: 'estado', key: 'estado', render: (v: string) => (
                  <Tag color={v === 'ACTIVA' ? 'blue' : v === 'RETORNO_PARCIAL' ? 'orange' : 'green'}>
                    {v.replace('_', ' ')}
                  </Tag>
                )},
                { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', render: (v: string) => new Date(v).toLocaleDateString('es-MX') },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
