'use client';

import { useMemo, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import apiClient from '@/lib/api-client';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { DataTableColumnConfig } from '@/components/DataTable/types';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useFormBuilderServices } from '@/hooks/master/useFormBuilderServices';
import { ManagePagesModal } from './formBuilder/ManagePagesModal';
import { AddFormTypeModal } from './formBuilder/AddFormTypeModal';
import { FbServiceRow } from '@/types/formBuilder';

export function FormBuilderMaster() {
  const router = useRouter();
  const locale = useLocale();
  const toast = useRef<Toast>(null);

  const { data: departments } = useDepartments();
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);

  const { data: rows = [], isLoading, refetch } = useFormBuilderServices(departmentId);

  // Manage Pages modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<{
    serviceId: string;
    formTypeId: number;
    formName: string;
  } | null>(null);

  // Add Form Type modal state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addFormService, setAddFormService] = useState<{
    serviceId: string;
    existingFormTypeIds: number[];
    existingFormCodes: string[];
  } | null>(null);

  const deptOptions = useMemo(() => {
    return (departments ?? []).map((d: any) => ({
      label: d.name,
      value: d.id,
    }));
  }, [departments]);

  async function handleGenerateCertificate(serviceId: string) {
    toast.current?.show({
      severity: 'info',
      summary: 'Coming soon',
      detail: `Generate Certificate for Service ${serviceId} will be implemented later.`,
      life: 2500,
    });
  }

  async function deleteFormMapping(serviceId: string, formTypeId: number) {
    const ok = window.confirm('Are you sure you want to delete this Form Type mapping?');
    if (!ok) return;

    try {
      await apiClient.delete(`/master/form-builder/services/${serviceId}/forms/${formTypeId}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Form type mapping deleted.',
        life: 2500,
      });
      await refetch();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Could not delete form mapping.',
        life: 3500,
      });
    }
  }

  const columns: DataTableColumnConfig<FbServiceRow>[] = [
    { field: 'serviceId', header: 'Service ID', filterType: 'text' },
    { field: 'serviceName', header: 'Service Name', filterType: 'text' },
    {
      field: 'forms',
      header: 'Forms',
      filterType: 'none',
      body: (row: FbServiceRow) => {
        const forms = row.forms ?? [];
        const existingFormTypeIds = forms.map((f) => f.formTypeId);
        const existingFormCodes = forms
          .map((f) => f.formCode)
          .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Service-level actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                label="Add Form Type"
                icon="pi pi-plus"
                size="small"
                onClick={() => {
                  setAddFormService({
                    serviceId: row.serviceId,
                    existingFormTypeIds,
                    existingFormCodes,
                  });
                  setAddFormOpen(true);
                }}
              />
              <Button
                label="Generate Certificate"
                icon="pi pi-file"
                size="small"
                severity="secondary"
                onClick={() => handleGenerateCertificate(row.serviceId)}
              />
            </div>

            {/* Forms list */}
            {forms.length === 0 ? (
              <div style={{ color: '#666' }}>No forms mapped</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {forms.map((f) => (
                  <div
                    key={`${row.serviceId}-${f.formTypeId}`}
                    style={{
                      border: '1px solid #e6e6e6',
                      borderRadius: 10,
                      padding: 12,
                      background: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ minWidth: 260 }}>
                      <div style={{ fontWeight: 700 }}>{f.formName}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        Type: {f.formTypeId} • Pages: {f.pagesCount} • Code: {f.formCode}
                      </div>
                    </div>

                    {/* Per-form actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        label="Manage Pages"
                        icon="pi pi-sitemap"
                        size="small"
                        onClick={() => {
                          setActiveService({
                            serviceId: row.serviceId,
                            formTypeId: f.formTypeId,
                            formName: f.formName,
                          });
                          setModalOpen(true);
                        }}
                      />
                      <Button
                        label="Open Builder"
                        icon="pi pi-pencil"
                        size="small"
                        severity="secondary"
                        onClick={() => {
                          // ✅ FIX: include locale so it matches /[locale]/admin/... route
                          router.push(
                            `/${locale}/admin/master/form-builder/services/${encodeURIComponent(
                              row.serviceId,
                            )}/forms/${f.formTypeId}/builder`,
                          );
                        }}
                      />
                      <Button
                        label="Delete"
                        icon="pi pi-trash"
                        size="small"
                        severity="danger"
                        onClick={() => deleteFormMapping(row.serviceId, f.formTypeId)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Toast ref={toast} />
      <h3>Form Builder</h3>

      <div style={{ marginBottom: 12 }}>
        <Dropdown
          value={departmentId}
          options={deptOptions}
          onChange={(e) => setDepartmentId(e.value)}
          className="w-100"
          placeholder="Select Department"
          filter
          filterBy="label"
          showClear
        />
      </div>

      <ReusableDataTable<FbServiceRow>
        data={rows}
        loading={isLoading}
        config={{
          dataKey: 'id',
          columns,
          globalFilterFields: ['serviceId', 'serviceName'],
          rows: 10,
          rowsPerPageOptions: [10, 25, 50],
          stripedRows: true,
          showGridlines: true,
        }}
      />

      {activeService && (
        <ManagePagesModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceId={activeService.serviceId}
          formTypeId={activeService.formTypeId}
          formName={activeService.formName}
        />
      )}

      {addFormService && (
        <AddFormTypeModal
          open={addFormOpen}
          onClose={() => setAddFormOpen(false)}
          serviceId={addFormService.serviceId}
          existingFormTypeIds={addFormService.existingFormTypeIds}
          existingFormCodes={addFormService.existingFormCodes}
          onSuccess={async () => {
            toast.current?.show({
              severity: 'success',
              summary: 'Added',
              detail: 'Form type mapping created.',
              life: 2500,
            });
            await refetch();
          }}
        />
      )}
    </div>
  );
}