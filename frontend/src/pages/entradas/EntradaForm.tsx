import { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Table, InputNumber, Card, Steps, message, Typography, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { almacenesService } from '../../services/almacenes.service.ts';
import { materialesService } from '../../services/materiales.service.ts';
import { entradasService } from '../../services/movimientos.service.ts';
import type { Almacen, Material } from '../../types/index.ts';

const { Title } = Typography;

interface DetalleItem { key: string; materialId: number | null; nombre: string; cantidad: number; }

export default function EntradaForm() {
  const [step,       setStep]      = useState(0);
  const [almacenes,  setAlmacenes] = useState<Almacen[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [detalle,    setDetalle]   = useState<DetalleItem[]>([{ key: '1', materialId: null, nombre: '', cantidad: 1 }]);
  const [saving,     setSaving]    = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([almacenesService.listar(), materialesService.listar()])
      .then(([a, m]) => { setAlmacenes(a); setMateriales(m); });
  }, []);

  const agregarFila = () => setDetalle((d) => [...d, { key: Date.now().toString(), materialId: null, nombre: '', cantidad: 1 }]);
  const quitarFila  = (key: string) => setDetalle((d) => d.filter((r) => r.key !== key));

  const setMaterial = (key: string, materialId: number) => {
    const mat = materiales.find((m) => m.id === materialId);
    setDetalle((d) => d.map((r) => r.key === key ? { ...r, materialId, nombre: mat?.nombre ?? '' } : r));
  };

  const setCantidad = (key: string, cantidad: number) =>
    setDetalle((d) => d.map((r) => r.key === key ? { ...r, cantidad } : r));

  const siguiente = async () => {
    await form.validateFields();
    setStep(1);
  };

  const guardar = async () => {
    const validos = detalle.filter((d) => d.materialId && d.cantidad > 0);
    if (validos.length === 0) { message.error('Agrega al menos un material'); return; }
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      await entradasService.crear({
        almacenId:  values.almacenId,
        proveedor:  values.proveedor,
        comentario: values.comentario,
        detalle:    validos.map((d) => ({ materialId: d.materialId!, cantidad: d.cantidad })),
      });
      message.success('Entrada registrada correctamente');
      navigate('/entradas');
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error al registrar la entrada');
    } finally {
      setSaving(false);
    }
  };

  const matUsados = detalle.map((d) => d.materialId).filter(Boolean);

  return (
    <>
      <Title level={4} style={{ marginBottom: 24 }}>Nueva Entrada</Title>

      <Card>
        <Steps current={step} items={[{ title: 'Datos generales' }, { title: 'Materiales' }, { title: 'Confirmar' }]} style={{ marginBottom: 32 }} />

        {step === 0 && (
          <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
            <Form.Item name="almacenId" label="Almacén" rules={[{ required: true }]}>
              <Select options={almacenes.filter((a) => a.activo).map((a) => ({ value: a.id, label: `${a.nombre} — ${a.proyecto}` }))} placeholder="Seleccionar almacén" />
            </Form.Item>
            <Form.Item name="proveedor" label="Proveedor" rules={[{ required: true, min: 2 }]}>
              <Input placeholder="Nombre del proveedor o persona que entrega" />
            </Form.Item>
            <Form.Item name="comentario" label="Comentario (opcional)">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Button type="primary" onClick={siguiente}>Siguiente</Button>
          </Form>
        )}

        {step === 1 && (
          <>
            <Table
              dataSource={detalle}
              rowKey="key"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Material', key: 'material', width: '50%',
                  render: (_: unknown, r: DetalleItem) => (
                    <Select
                      value={r.materialId ?? undefined}
                      onChange={(v) => setMaterial(r.key, v)}
                      options={materiales.filter((m) => m.activo && (m.id === r.materialId || !matUsados.includes(m.id))).map((m) => ({ value: m.id, label: `${m.nombre} (${m.unidadMedida})` }))}
                      placeholder="Seleccionar material"
                      showSearch
                      filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Cantidad', key: 'cantidad', width: '25%',
                  render: (_: unknown, r: DetalleItem) => (
                    <InputNumber min={1} value={r.cantidad} onChange={(v) => setCantidad(r.key, v ?? 1)} style={{ width: '100%' }} />
                  ),
                },
                {
                  title: '', key: 'del', width: '10%',
                  render: (_: unknown, r: DetalleItem) => (
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => quitarFila(r.key)} disabled={detalle.length === 1} />
                  ),
                },
              ]}
            />
            <Button icon={<PlusOutlined />} onClick={agregarFila} style={{ marginTop: 12 }}>Agregar material</Button>
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button onClick={() => setStep(0)}>Anterior</Button>
                <Button type="primary" onClick={() => setStep(2)}>Siguiente</Button>
              </Space>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p><strong>Almacén:</strong> {almacenes.find((a) => a.id === form.getFieldValue('almacenId'))?.nombre}</p>
            <p><strong>Proveedor:</strong> {form.getFieldValue('proveedor')}</p>
            {form.getFieldValue('comentario') && <p><strong>Comentario:</strong> {form.getFieldValue('comentario')}</p>}
            <Table
              dataSource={detalle.filter((d) => d.materialId)}
              rowKey="key"
              pagination={false}
              size="small"
              columns={[
                { title: 'Material', dataIndex: 'nombre', key: 'nombre' },
                { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad' },
              ]}
              style={{ marginBottom: 24 }}
            />
            <Space>
              <Button onClick={() => setStep(1)}>Anterior</Button>
              <Button type="primary" loading={saving} onClick={guardar}>Confirmar entrada</Button>
            </Space>
          </>
        )}
      </Card>
    </>
  );
}
