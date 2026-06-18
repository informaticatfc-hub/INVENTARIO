import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, Select, Tooltip, Modal, InputNumber, message } from 'antd';
import { PlusOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { salidasService } from '../../services/movimientos.service.ts';
import { almacenesService } from '../../services/almacenes.service.ts';
import type { Salida, Almacen } from '../../types/index.ts';
import dayjs from 'dayjs';

const { Title } = Typography;

const ESTADO_COLOR: Record<string, string> = { ACTIVA: 'blue', RETORNO_PARCIAL: 'orange', RETORNO_TOTAL: 'green' };

export default function SalidasList() {
  const [salidas,   setSalidas]   = useState<Salida[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [filtros,   setFiltros]   = useState<Record<string, unknown>>({});
  const [retModal,  setRetModal]  = useState<{ open: boolean; salida: Salida | null }>({ open: false, salida: null });
  const [retCants,  setRetCants]  = useState<Record<number, number>>({});
  const [saving,    setSaving]    = useState(false);
  const navigate = useNavigate();

  const cargar = (p = page, f = filtros) => {
    setLoading(true);
    salidasService.listar({ page: p, pageSize: 20, ...f })
      .then((r) => { setSalidas(r.data); setTotal(r.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { almacenesService.listar().then(setAlmacenes); cargar(); }, []);

  const abrirRetorno = (salida: Salida) => {
    const inicial: Record<number, number> = {};
    salida.detalle.forEach((d) => {
      const pend = (d.cantidadSolicitada ?? 0) - d.cantidadRetornada;
      if (pend > 0) inicial[d.materialId] = pend;
    });
    setRetCants(inicial);
    setRetModal({ open: true, salida });
  };

  const confirmarRetorno = async () => {
    const { salida } = retModal;
    if (!salida) return;
    setSaving(true);
    try {
      const detalle = Object.entries(retCants)
        .filter(([, v]) => v > 0)
        .map(([materialId, cantidadRetorno]) => ({ materialId: Number(materialId), cantidadRetorno }));
      await salidasService.retornar(salida.id, { detalle });
      message.success('Retorno registrado');
      setRetModal({ open: false, salida: null });
      cargar();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error en el retorno');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Folio',    dataIndex: 'folio',    key: 'folio', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Almacén', dataIndex: ['almacen', 'nombre'], key: 'almacen' },
    { title: 'Tramo',   dataIndex: 'tramo',    key: 'tramo' },
    { title: 'Solicitó', dataIndex: 'solicito', key: 'solicito' },
    { title: 'Estado',   dataIndex: 'estado',   key: 'estado', render: (v: string) => <Tag color={ESTADO_COLOR[v]}>{v.replace('_', ' ')}</Tag> },
    { title: 'Retornable', dataIndex: 'retornable', key: 'ret', render: (v: boolean) => v ? <Tag color="purple">Sí</Tag> : '—' },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    {
      title: '', key: 'acc', render: (_: unknown, r: Salida) => (
        <Space>
          <Tooltip title="Ver"><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/salidas/${r.id}`)} /></Tooltip>
          {r.retornable && r.estado !== 'RETORNO_TOTAL' && (
            <Tooltip title="Registrar retorno"><Button size="small" icon={<RollbackOutlined />} onClick={() => abrirRetorno(r)} /></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Salidas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/salidas/nueva')}>Nueva salida</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="Almacén" allowClear style={{ width: 200 }} options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
          onChange={(v) => { const f = { ...filtros, almacenId: v }; setFiltros(f); cargar(1, f); setPage(1); }} />
        <Select placeholder="Estado" allowClear style={{ width: 180 }} options={[{ value: 'ACTIVA', label: 'Activa' }, { value: 'RETORNO_PARCIAL', label: 'Retorno parcial' }, { value: 'RETORNO_TOTAL', label: 'Retorno total' }]}
          onChange={(v) => { const f = { ...filtros, estado: v }; setFiltros(f); cargar(1, f); setPage(1); }} />
      </Space>

      <Table dataSource={salidas} rowKey="id" loading={loading} columns={columns}
        pagination={{ total, current: page, pageSize: 20, onChange: (p) => { setPage(p); cargar(p); } }} />

      <Modal title="Registrar retorno" open={retModal.open} onOk={confirmarRetorno} onCancel={() => setRetModal({ open: false, salida: null })} confirmLoading={saving} okText="Confirmar retorno">
        {retModal.salida?.detalle.filter((d) => (d.cantidadSolicitada ?? 0) - d.cantidadRetornada > 0).map((d) => (
          <div key={d.materialId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>{(d as any).material?.nombre} <small>(pendiente: {(d.cantidadSolicitada ?? 0) - d.cantidadRetornada})</small></span>
            <InputNumber min={0} max={(d.cantidadSolicitada ?? 0) - d.cantidadRetornada} value={retCants[d.materialId] ?? 0}
              onChange={(v) => setRetCants((c) => ({ ...c, [d.materialId]: v ?? 0 }))} style={{ width: 100 }} />
          </div>
        ))}
      </Modal>
    </>
  );
}
