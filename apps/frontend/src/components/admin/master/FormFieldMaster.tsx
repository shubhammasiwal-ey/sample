
'use client';
import { useMemo, useRef, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  useToggleFormField,
} from '@/hooks/master/useFormFields';
import { useFormCategoryRoots } from '@/hooks/master/useFormCategoryRoots';

type FormField = {
  id: number;
  formCheckId: string;
  name: string;
  parentId: number;
  categoryId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const FormFieldMaster = () => {
  const { data: fields = [], isLoading } = useFormFields();
  const { data: roots = [] } = useFormCategoryRoots();

  const rootCategoryOptions = useMemo(
    () =>
      roots.map((r: any) => ({
        label: `${r.categoryCode} — ${r.categoryName}`,
        value: r.id,
      })),
    [roots]
  );

  const createMutation = useCreateFormField();
  const updateMutation = useUpdateFormField();
  const deleteMutation = useDeleteFormField();
  const toggleMutation = useToggleFormField();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    isActive: true,
  });

  // 👇 anchor for Dropdown panel so it stays inside dialog
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  const tableConfig: ReusableDataTableConfig<FormField> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '6%', filterType: 'number' },
        { field: 'formCheckId', header: 'Code', width: '16%', filterType: 'text' },
        { field: 'name', header: 'Field Label', width: '28%', filterType: 'text' },
        { field: 'parentId', header: 'Parent ID', width: '10%', filterType: 'number' },
        { field: 'categoryId', header: 'Category ID', width: '10%', filterType: 'number' },
        {
          field: 'isActive',
          header: 'Status',
          width: '10%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row) => (
            <Tag value={row.isActive ? 'Active' : 'Inactive'} severity={row.isActive ? 'success' : 'danger'} />
          ),
        },
        {
          field: 'createdAt',
          header: 'Created',
          width: '12%',
          filterType: 'date',
          body: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      globalFilterFields: ['formCheckId', 'name'],
      emptyMessage: 'No form fields found.',
    }),
    []
  );

  const rowActions: RowAction<FormField>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: (r) => handleEdit(r) },
      { icon: 'pi pi-check', label: 'Activate', severity: 'success', onClick: (r) => handleToggle(r), visible: (r) => !r.isActive },
      { icon: 'pi pi-times', label: 'Deactivate', severity: 'warn', onClick: (r) => handleToggle(r), visible: (r) => r.isActive },
      { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: (r) => handleDelete(r) },
    ],
    []
  );

  const handleEdit = useCallback((r: FormField) => {
    setFormData({
      name: r.name || '',
      categoryId: r.categoryId ? String(r.categoryId) : '',
      isActive: r.isActive,
    });
    setEditingId(r.id);
    setShowDialog(true);
  }, []);

  const handleToggle = useCallback(
    async (r: FormField) => {
      try {
        await toggleMutation.mutateAsync(r.id);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Status updated' });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to update status';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [toggleMutation]
  );

  const handleDelete = useCallback(
    async (r: FormField) => {
      if (!confirm(`Delete ${r.formCheckId} - ${r.name}?`)) return;
      try {
        await deleteMutation.mutateAsync(r.id);
        toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Form field deleted' });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to delete';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [deleteMutation]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        isActive: formData.isActive,
      };
      if (!payload.categoryId) {
        toastRef.current?.show({ severity: 'warn', summary: 'Missing category', detail: 'Please select a Category (Root).' });
        return;
      }

      try {
        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: payload });
          toastRef.current?.show({ severity: 'success', summary: 'Updated', detail: 'Form field updated' });
        } else {
          await createMutation.mutateAsync(payload);
          toastRef.current?.show({ severity: 'success', summary: 'Created', detail: 'Form field created' });
        }
        setShowDialog(false);
        setEditingId(null);
        setFormData({ name: '', categoryId: '', isActive: true });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to save';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [editingId, formData, createMutation, updateMutation]
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Form Field Master</h1>
        <Toolbar
          left={() => (
            <Button
              label="Add Field"
              icon="pi pi-plus"
              severity="success"
              onClick={() => {
                setFormData({ name: '', categoryId: '', isActive: true });
                setEditingId(null);
                setShowDialog(true);
              }}
            />
          )}
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Field' : 'Add New Field'}
        modal
        style={{ width: '50vw' }}
      >
        {/* 👇 anchor element for panel */}
        <div ref={dialogContentRef}>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Field Label *</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))}
                  required
                  className="w-100"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Category (Root) *</label>

                <Dropdown
                  value={formData.categoryId ? Number(formData.categoryId) : null}
                  options={rootCategoryOptions}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: String(e.value) }))}
                  placeholder="Select Category"
                  className="w-100"
                  filter
                  showClear
                  /* ⬇️ append to the dropdown itself, so position aligns perfectly */
                  appendTo="self"
                  /* style the panel and keep it within the input width */
                  panelClassName="pfield-panel"
                  panelStyle={{ maxWidth: '100%', maxHeight: '40vh', overflowY: 'auto' }}
                  valueTemplate={(opt, props) =>
                    opt ? (
                      <span className="text-truncate" title={opt.label} style={{ maxWidth: '100%' }}>
                        {opt.label}
                      </span>
                    ) : (
                      <span className="text-muted">{props.placeholder}</span>
                    )
                  }
                />

              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Active</label>
                <div className="form-check">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: (e.target as HTMLInputElement).checked }))}
                  />
                  <label className="form-check-label" htmlFor="isActive">Active</label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                label={editingId ? 'Update' : 'Create'}
                icon="pi pi-check"
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                className="flex-grow-1"
              />
              <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
            </div>
          </form>
        </div>
      </Dialog>

      <ReusableDataTable<FormField> data={fields} config={tableConfig} loading={isLoading} rowActions={rowActions} />

      {/* ✅ file-scoped styles for the dropdown panel */}
      <style jsx>{`
        :global(.pfield-panel) {
          max-width: 100%;
          min-width: 100%;
          width: auto;
          box-sizing: border-box;
        }
        :global(.pfield-panel .p-dropdown-items .p-dropdown-item) {
          white-space: normal;
          word-break: break-word;
          line-height: 1.3;
        }
        :global(.pfield-panel .p-dropdown-filter-container) {
          max-width: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};
