import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Typography, Spin, Alert, Progress } from 'antd';
import { ArrowLeftOutlined, WarningOutlined } from '@ant-design/icons';
import { almacenesService } from '../../services/almacenes.service.ts';
import type { Almacen } from '../../types/index.ts';

const { Title, Text } = Typography;

interface StockRow { materialId: number; nombre: string; unidadMedida: string; categoria: string; cantidadActual: number; stockMinimo: number; bajoMinimo: boolean; }

export default function AlmacenDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [stock,   setStock]   = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([almacenesService.obtener(Number(id)), almacenesService.stock(Number(id))])
      .then(([a, s]) => { setAlmacen(a); setStock(s as unknown as StockRow[]); })
      .catch(() => setError('No se pudo cargar el almacén'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;

  const columns = [
    { title: 'Material',    dataIndex: 'nombre',         key: 'nombre' },
    { title: 'Categoría',   dataIndex: 'categoria',      key: 'categoria' },
    { title: 'Unidad',      dataIndex: 'unidadMedida',   key: 'unidadMedida' },
    {
      title: 'Stock actual',
      key: 'stock',
      render: (_: unknown, r: StockRow) => (
        <span>
          {r.bajoMinimo && <WarningOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />}
          <Text type={r.bajoMinimo ? 'danger' : undefined}>{r.cantidadActual}</Text>
          {r.stockMinimo > 0 && <Text type="secondary"> / mín. {r.stockMinimo}</Text>}
        </span>
      ),
    },
    {
      title: 'Nivel',
      key: 'nivel',
      render: (_: unknown, r: StockRow) => {
        if (r.stockMinimo === 0) return null;
        const pct = Math.min(100, Math.round((r.cantidadActual / (r.stockMinimo * 2)) * 100));
        return <Progress percent={pct} size="small" status={r.bajoMinimo ? 'exception' : 'normal'} showInfo={false} style={{ width: 80 }} />;
      },
    },
    { title: 'Alerta', dataIndex: 'bajoMinimo', key: 'bajoMinimo', render: (v: boolean) => v ? <Tag color="red">Bajo mínimo</Tag> : <Tag color="green">OK</Tag> },
  ];

  return (
    <>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/almacenes')} style={{ marginBottom: 16 }}>
        Volver
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{almacen?.nombre}</Title>
        <Text type="secondary">Proyecto: {almacen?.proyecto}</Text>
        {almacen?.responsable && <Text type="secondary" style={{ marginLeft: 16 }}>Responsable: {(almacen as any).responsable?.nombre}</Text>}
      </Card>

      <Card title={`Stock actual — ${stock.length} materiales`}>
        <Table dataSource={stock} rowKey="materialId" columns={columns} size="small"
          rowClassName={(r: StockRow) => r.bajoMinimo ? 'ant-table-row-danger' : ''}
        />
      </Card>
    </>
  );
}
