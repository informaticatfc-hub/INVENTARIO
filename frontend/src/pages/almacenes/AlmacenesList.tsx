import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Tooltip, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { almacenesService } from '../../services/almacenes.service.ts';
import type { Almacen } from '../../types/index.ts';

const { Title } = Typography;

export default function AlmacenesList() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<{ open: boolean; record: Almacen | null }>({ open: false, record: null });
  const [saving,    setSaving]    = useState(false);
  const [form]  = Form.useForm();
  const navigate = useNavigate();

  const cargar = () => {
    setLoading(true);
    almacenesService.listar().then(setAlmacenes).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (record: Almacen | null) => {
    setModal({ open: true, record });
    if (record) form.setFieldsValue(record);
    else form.resetFields();
  };

  const guardar = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (modal.record) {
        await almacenesService.actualizar(modal.record.id, values);
        message.success('Almacén actualizado');
      } else {
        await almacenesService.crear(values);
        message.success('Almacén creado');
      }
      setModal({ open: false, record: null });
      cargar();
    } catch (e: any) {
      if (e.response) message.error(e.response.data.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Nombre',  dataIndex: 'nombre',  key: 'nombre', sorter: (a: Almacen, b: Almacen) => a.nombre.localeCompare(b.nombre) },
    { title: 'Proyecto', dataIndex: 'proyecto', key: 'proyecto' },
    { title: 'Responsable', dataIndex: ['responsable', 'nombre'], key: 'responsable', render: (v: string) => v ?? '—' },
    { title: 'Estado', dataIndex: 'activo', key: 'activo', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Activo' : 'Inactivo'}</Tag> },
    {
      title: 'Acciones', key: 'acciones', render: (_: unknown, record: Almacen) => (
        <Space>
          <Tooltip title="Ver stock"><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/almacenes/${record.id}`)} /></Tooltip>
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />}  onClick={() => abrirModal(record)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Almacenes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal(null)}>Nuevo almacén</Button>
      </div>

      <Table dataSource={almacenes} rowKey="id" loading={loading} columns={columns} />

      <Modal
        title={modal.record ? 'Editar almacén' : 'Nuevo almacén'}
        open={modal.open}
        onOk={guardar}
        onCancel={() => setModal({ open: false, record: null })}
        confirmLoading={saving}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nombre"   label="Nombre"   rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="proyecto" label="Proyecto" rules={[{ required: true }]}><Input /></Form.Item>
          {modal.record && (
            <Form.Item name="activo" label="Estado">
              <Select options={[{ value: true, label: 'Activo' }, { value: false, label: 'Inactivo' }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
