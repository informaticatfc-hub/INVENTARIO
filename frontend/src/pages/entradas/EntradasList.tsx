import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, DatePicker, Select, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { entradasService } from '../../services/movimientos.service.ts';
import { almacenesService } from '../../services/almacenes.service.ts';
import type { Entrada, Almacen } from '../../types/index.ts';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function EntradasList() {
  const [entradas,  setEntradas]  = useState<Entrada[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [filtros,   setFiltros]   = useState<{ almacenId?: number; desde?: string; hasta?: string }>({});
  const navigate = useNavigate();

  const cargar = (p = page, f = filtros) => {
    setLoading(true);
    entradasService.listar({ page: p, pageSize: 20, ...f })
      .then((r) => { setEntradas(r.data); setTotal(r.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { almacenesService.listar().then(setAlmacenes); cargar(); }, []);

  const columns = [
    { title: 'Folio',    dataIndex: 'folio',    key: 'folio', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Almacén', dataIndex: ['almacen', 'nombre'], key: 'almacen' },
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor' },
    { title: 'Materiales', dataIndex: 'detalle', key: 'materiales', render: (d: any[]) => d?.length ?? 0 },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
    { title: 'Autorizó', dataIndex: ['autorizo', 'nombre'], key: 'autorizo' },
    {
      title: '', key: 'acc', render: (_: unknown, r: Entrada) => (
        <Tooltip title="Ver detalle"><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/entradas/${r.id}`)} /></Tooltip>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Entradas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/entradas/nueva')}>Nueva entrada</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filtrar por almacén"
          allowClear
          style={{ width: 220 }}
          options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
          onChange={(v) => { const f = { ...filtros, almacenId: v }; setFiltros(f); cargar(1, f); setPage(1); }}
        />
        <RangePicker
          onChange={(dates) => {
            const f = { ...filtros, desde: dates?.[0]?.toISOString(), hasta: dates?.[1]?.toISOString() };
            setFiltros(f); cargar(1, f); setPage(1);
          }}
        />
      </Space>

      <Table
        dataSource={entradas}
        rowKey="id"
        loading={loading}
        columns={columns}
        pagination={{ total, current: page, pageSize: 20, onChange: (p) => { setPage(p); cargar(p); } }}
      />
    </>
  );
}
