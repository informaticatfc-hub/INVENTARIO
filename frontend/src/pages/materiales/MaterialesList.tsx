import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, Typography, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { materialesService } from '../../services/materiales.service.ts';
import type { Material, Categoria } from '../../types/index.ts';

const { Title } = Typography;

export default function MaterialesList() {
  const [materiales,  setMateriales]  = useState<Material[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState<{ open: boolean; record: Material | null }>({ open: false, record: null });
  const [saving,      setSaving]      = useState(false);
  const [filtro,      setFiltro]      = useState<string>('');
  const [form] = Form.useForm();

  const cargar = () => {
    setLoading(true);
    Promise.all([materialesService.listar(), materialesService.listarCategorias()])
      .then(([m, c]) => { setMateriales(m); setCategorias(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (record: Material | null) => {
    setModal({ open: true, record });
    if (record) form.setFieldsValue(record);
    else form.resetFields();
  };

  const guardar = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (modal.record) {
        await materialesService.actualizar(modal.record.id, values);
        message.success('Material actualizado');
      } else {
        await materialesService.crear(values);
        message.success('Material creado');
      }
      setModal({ open: false, record: null });
      cargar();
    } catch (e: any) {
      if (e.response) message.error(e.response.data.message);
    } finally {
      setSaving(false);
    }
  };

  const filtrados = materiales.filter((m) =>
    m.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const columns = [
    { title: 'Nombre',       dataIndex: 'nombre',       key: 'nombre' },
    { title: 'Categoría',    dataIndex: ['categoria', 'nombre'], key: 'categoria', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Unidad',       dataIndex: 'unidadMedida', key: 'unidadMedida' },
    { title: 'Stock mínimo', dataIndex: 'stockMinimo',  key: 'stockMinimo' },
    { title: 'Estado',       dataIndex: 'activo',       key: 'activo', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Activo' : 'Inactivo'}</Tag> },
    {
      title: 'Acciones', key: 'acciones', render: (_: unknown, record: Material) => (
        <Space>
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />} onClick={() => abrirModal(record)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Catálogo de Materiales</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal(null)}>Nuevo material</Button>
      </div>

      <Input.Search placeholder="Buscar material..." value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: 280, marginBottom: 16 }} />

      <Table dataSource={filtrados} rowKey="id" loading={loading} columns={columns} />

      <Modal title={modal.record ? 'Editar material' : 'Nuevo material'} open={modal.open} onOk={guardar} onCancel={() => setModal({ open: false, record: null })} confirmLoading={saving} okText="Guardar" cancelText="Cancelar">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nombre"       label="Nombre"         rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="categoriaId"  label="Categoría"      rules={[{ required: true }]}>
            <Select options={categorias.map((c) => ({ value: c.id, label: c.nombre }))} placeholder="Seleccionar categoría" />
          </Form.Item>
          <Form.Item name="unidadMedida" label="Unidad de medida" rules={[{ required: true }]}><Input placeholder="pza, kg, m, rollo..." /></Form.Item>
          <Form.Item name="stockMinimo"  label="Stock mínimo"   initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="descripcion"  label="Descripción"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
