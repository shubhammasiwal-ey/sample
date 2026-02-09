'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';

import {
  useWorkflowConfigs,
  useCreateWorkflowConfig,
  useUpdateWorkflowConfig,
  useDeleteWorkflowConfig,
  WorkflowConfig,
} from '@/hooks/master/useWorkflowConfigs';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useServices } from '@/hooks/master/useServices';
import { useFormTypes } from '@/hooks/master/useFormTypes';
import { useRoles } from '@/hooks/useAdminData';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';

import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareExportData,
} from '@/lib/export-utils';

const yesNoOptions = [
  { label: 'Yes', value: 'Y' },
  { label: 'No', value: 'N' },
];

const processingLevelOptions = [
  { label: 'District', value: 'District' },
  { label: 'State', value: 'State' },
];

type WorkflowGroup = {
  id: number;
  serviceId: string;
  serviceName: string;
  departmentName: string;
  count: number;
  configs: WorkflowConfig[];
};

type WorkflowRow = {
  id?: number;
  processingLevel: string;
  currentRoleId: number;
  formTypeId: number;
  nextRoleId: number;
  approverId: number;
  forwardRoleId: number;
  revertRoleId: number;
  isDelayReasonRequired: string;
  timeInHours: string;
  canRevertToInvestor: string;
  canVerifyDocument: string;
  isOwnDepartment: string;
  step: number | string;
  departmentId: number;
  serviceId: string;
  permissableTabFormId: string;
  subformActionName: string;
};

const buildDefaultRow = (departmentId: number, serviceId: string): WorkflowRow => ({
  processingLevel: 'District',
  currentRoleId: 0,
  formTypeId: 0,
  nextRoleId: 0,
  approverId: 0,
  forwardRoleId: 0,
  revertRoleId: 0,
  isDelayReasonRequired: 'N',
  timeInHours: '0',
  canRevertToInvestor: 'N',
  canVerifyDocument: 'N',
  isOwnDepartment: 'N',
  step: 0,
  departmentId,
  serviceId,
  permissableTabFormId: '',
  subformActionName: '',
});

export const WorkflowConfigMaster = () => {
  const { data: workflowConfigs = [], isLoading } = useWorkflowConfigs();
  const { data: departments = [] } = useDepartments();
  const { data: services = [] } = useServices();
  const { data: formTypes = [] } = useFormTypes();
  const { data: roles = [] } = useRoles();

  const createMutation = useCreateWorkflowConfig();
  const updateMutation = useUpdateWorkflowConfig();
  const deleteMutation = useDeleteWorkflowConfig();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [rows, setRows] = useState<WorkflowRow[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [deletedRowIds, setDeletedRowIds] = useState<number[]>([]);

  const [formRow, setFormRow] = useState<WorkflowRow>(buildDefaultRow(0, ''));

  const groupedConfigs = useMemo<WorkflowGroup[]>(() => {
    const groups = new Map<string, WorkflowGroup>();
    workflowConfigs.forEach((config) => {
      const serviceId = config.serviceId || '';
      if (!groups.has(serviceId)) {
        groups.set(serviceId, {
          id: config.id ?? 0,
          serviceId,
          serviceName: config.service?.service_name || serviceId,
          departmentName: config.department?.name || String(config.departmentId || ''),
          count: 0,
          configs: [],
        });
      }
      const group = groups.get(serviceId)!;
      group.configs.push(config);
      group.count += 1;
    });
    return Array.from(groups.values());
  }, [workflowConfigs]);

  const initialData = useMemo(() => groupedConfigs, [groupedConfigs]);

  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
    globalFilter,
    filters,
  } = useDataTableManager<WorkflowGroup>(initialData);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments]
  );

  const serviceOptions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return services
      .filter((s: any) => Number(s.department_id) === Number(selectedDepartmentId))
      .map((s: any) => ({ label: s.service_name || s.name || s.service_id, value: s.service_id }));
  }, [services, selectedDepartmentId]);

  const formTypeOptions = useMemo(
    () => (formTypes as Array<{ id: number; name: string }>).map((f) => ({ label: f.name, value: f.id })),
    [formTypes]
  );

  const roleOptions = useMemo(() => {
    const mapped = roles.map((r: any) => ({ label: `${r.name} (${r.id})`, value: r.id }));
    const hasApplicant = mapped.some((r) => Number(r.value) === 0);
    return hasApplicant ? mapped : [{ label: 'Applicant (0)', value: 0 }, ...mapped];
  }, [roles]);

  const tableConfig: ReusableDataTableConfig<WorkflowGroup> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '6%', filterType: 'none' },
        { field: 'serviceId', header: 'Service ID', width: '12%', filterType: 'text' },
        {
          field: 'serviceName',
          header: 'Service',
          width: '26%',
          filterType: 'text',
          body: (row) => <span className="fw-semibold">{row.serviceName || row.serviceId}</span>,
        },
        {
          field: 'departmentName',
          header: 'Department',
          width: '18%',
          filterType: 'text',
        },
        {
          field: 'count',
          header: 'Rows',
          width: '8%',
          filterType: 'none',
        },
      ],
      dataKey: 'serviceId',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['serviceId', 'serviceName', 'departmentName'],
      selectable: true,
      selectionMode: 'multiple',
      selectionColumnWidth: '1.25rem',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No workflow configs found.',
      tableClassName: 'workflow-config-table',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setSelectedDepartmentId(0);
    setSelectedServiceId('');
    setRows([]);
    setEditingRowIndex(null);
    setDeletedRowIds([]);
    setFormRow(buildDefaultRow(0, ''));
    setEditingServiceId(null);
  }, []);

  const getRoleLabel = useCallback(
    (id: number) => roleOptions.find((r) => r.value === id)?.label || (id ? `(${id})` : ''),
    [roleOptions]
  );

  const getFormTypeLabel = useCallback(
    (id: number) => formTypeOptions.find((f) => f.value === id)?.label || String(id || ''),
    [formTypeOptions]
  );

  const handleAddOrUpdateRow = useCallback(() => {
    if (!formRow.processingLevel || !formRow.formTypeId) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Processing Level and Form Type are required' });
      return;
    }

    if (!selectedDepartmentId || !selectedServiceId) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Department and Service are required' });
      return;
    }

    const nextRow: WorkflowRow = {
      ...formRow,
      departmentId: selectedDepartmentId,
      serviceId: selectedServiceId,
    };

    setRows((prev) => {
      if (editingRowIndex !== null) {
        const updated = [...prev];
        const current = updated[editingRowIndex];
        updated[editingRowIndex] = {
          ...nextRow,
          id: current?.id,
          permissableTabFormId: current?.permissableTabFormId || nextRow.permissableTabFormId,
          subformActionName: current?.subformActionName || nextRow.subformActionName,
        };
        return updated;
      }
      return [...prev, nextRow];
    });

    setEditingRowIndex(null);
    setFormRow(buildDefaultRow(selectedDepartmentId, selectedServiceId));
  }, [formRow, selectedDepartmentId, selectedServiceId, editingRowIndex]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartmentId || !selectedServiceId) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Department and Service are required' });
      return;
    }

    if (rows.length === 0) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Add at least one workflow row' });
      return;
    }

    try {
      for (const id of deletedRowIds) {
        await deleteMutation.mutateAsync(id);
      }

      for (const row of rows) {
        const payload = {
          ...row,
          step: Number(row.step) || 0,
          departmentId: Number(selectedDepartmentId),
          serviceId: selectedServiceId,
          currentRoleId: Number(row.currentRoleId) || 0,
          formTypeId: Number(row.formTypeId) || 0,
          nextRoleId: Number(row.nextRoleId) || 0,
          approverId: Number(row.approverId) || 0,
          forwardRoleId: Number(row.forwardRoleId) || 0,
          revertRoleId: Number(row.revertRoleId) || 0,
          permissableTabFormId: row.permissableTabFormId || '',
          subformActionName: row.subformActionName || '',
        };

        if (row.id) {
          await updateMutation.mutateAsync({ id: row.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload as any);
        }
      }

      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Workflow configuration saved successfully' });
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Error saving workflow config',
      });
    }
  }, [selectedDepartmentId, selectedServiceId, rows, deletedRowIds, createMutation, updateMutation, deleteMutation, resetForm]);

  const handleEditGroup = useCallback((group: WorkflowGroup) => {
    const deptId = group.configs[0]?.departmentId || 0;
    setSelectedDepartmentId(deptId);
    setSelectedServiceId(group.serviceId);
    setRows(
      group.configs.map((row) => ({
        id: row.id,
        processingLevel: row.processingLevel || 'District',
        currentRoleId: row.currentRoleId || 0,
        formTypeId: row.formTypeId || 0,
        nextRoleId: row.nextRoleId || 0,
        approverId: row.approverId || 0,
        forwardRoleId: row.forwardRoleId || 0,
        revertRoleId: row.revertRoleId || 0,
        isDelayReasonRequired: row.isDelayReasonRequired || 'N',
        timeInHours: row.timeInHours || '0',
        canRevertToInvestor: row.canRevertToInvestor || 'N',
        canVerifyDocument: row.canVerifyDocument || 'N',
        isOwnDepartment: row.isOwnDepartment || 'N',
        step: row.step || 0,
        departmentId: row.departmentId || deptId,
        serviceId: row.serviceId || group.serviceId,
        permissableTabFormId: row.permissableTabFormId || '',
        subformActionName: row.subformActionName || '',
      }))
    );
    setFormRow(buildDefaultRow(deptId, group.serviceId));
    setEditingRowIndex(null);
    setDeletedRowIds([]);
    setEditingServiceId(group.serviceId);
    setShowDialog(true);
  }, []);

  const handleDeleteGroup = useCallback(async (group: WorkflowGroup) => {
    if (!confirm('Are you sure you want to delete all workflow rows for this service?')) {
      return;
    }
    try {
      for (const config of group.configs) {
        await deleteMutation.mutateAsync(config.id);
      }
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Workflow configs deleted successfully' });
    } catch {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error deleting workflow configs' });
    }
  }, [deleteMutation]);

  const rowActions: RowAction<WorkflowGroup>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: handleEditGroup, tooltip: 'Edit' },
      { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: handleDeleteGroup, tooltip: 'Delete' },
    ],
    [handleEditGroup, handleDeleteGroup]
  );

  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      exportToCSV(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `CSV exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      await exportToExcel(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `Excel exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const handleExportPDF = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      exportToPDF(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `PDF exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const leftToolbarTemplate = useCallback(() => (
    <Button
      label="Add Workflow Config"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  ), [resetForm]);

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange('');
            handleFiltersChange({});
          }}
        />
        <Button label="CSV" icon="pi pi-download" severity="info" rounded onClick={handleExportCSV} loading={exporting} disabled={isLoading} />
        <Button label="Excel" icon="pi pi-file-excel" severity="success" rounded onClick={handleExportExcel} loading={exporting} disabled={isLoading} />
        <Button label="PDF" icon="pi pi-file-pdf" severity="warning" rounded onClick={handleExportPDF} loading={exporting} disabled={isLoading} />
      </div>
    ),
    [clearFilters, handleGlobalFilterChange, handleFiltersChange, handleExportCSV, handleExportExcel, handleExportPDF, exporting, isLoading]
  );

  return (
    <div className="p-4">
      <style jsx global>{`
        .workflow-config-table .p-datatable-thead > tr > th,
        .workflow-config-table .p-datatable-tbody > tr > td {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        .workflow-config-table .p-selection-column {
          padding-left: 0.25rem !important;
          padding-right: 0.25rem !important;
        }
        .workflow-config-table .p-datatable-thead > tr > th:nth-child(2),
        .workflow-config-table .p-datatable-tbody > tr > td:nth-child(2) {
          padding-left: 0.25rem !important;
        }
      `}</style>
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Application Workflow Configuration</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingServiceId ? 'Edit Workflow Config' : 'Add Workflow Config'}
        modal
        style={{ width: '75vw' }}
        breakpoints={{ '960px': '95vw', '640px': '98vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Department *</label>
              <Dropdown
                value={selectedDepartmentId || undefined}
                options={departmentOptions}
                onChange={(e) => {
                  setSelectedDepartmentId(e.value || 0);
                  setSelectedServiceId('');
                  setRows([]);
                  setFormRow(buildDefaultRow(e.value || 0, ''));
                }}
                placeholder="Select Department"
                className="w-100 border"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Service *</label>
              <Dropdown
                value={selectedServiceId || undefined}
                options={serviceOptions}
                onChange={(e) => {
                  setSelectedServiceId(e.value || '');
                  setRows([]);
                  setFormRow(buildDefaultRow(selectedDepartmentId, e.value || ''));
                }}
                placeholder="Select Service"
                className="w-100 border"
                disabled={!selectedDepartmentId}
              />
            </div>
          </div>

          {selectedServiceId && (
            <>
              <div className="mt-4 border rounded p-3">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Processing Level</label>
                    <Dropdown
                      value={formRow.processingLevel}
                      options={processingLevelOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, processingLevel: e.value }))}
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Current Role</label>
                    <Dropdown
                      value={formRow.currentRoleId || 0}
                      options={roleOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, currentRoleId: e.value }))}
                      placeholder="Select Role"
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Form Type</label>
                    <Dropdown
                      value={formRow.formTypeId || 0}
                      options={formTypeOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, formTypeId: e.value }))}
                      placeholder="Select Form Type"
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Next Role</label>
                    <Dropdown
                      value={formRow.nextRoleId || 0}
                      options={roleOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, nextRoleId: e.value }))}
                      placeholder="Select Role"
                      className="w-100 border"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Approver Role</label>
                    <Dropdown
                      value={formRow.approverId || 0}
                      options={roleOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, approverId: e.value }))}
                      placeholder="Select Role"
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Forward Role</label>
                    <Dropdown
                      value={formRow.forwardRoleId || 0}
                      options={roleOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, forwardRoleId: e.value }))}
                      placeholder="Select Role"
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Revert Role</label>
                    <Dropdown
                      value={formRow.revertRoleId || 0}
                      options={roleOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, revertRoleId: e.value }))}
                      placeholder="Select Role"
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Delay Reason Required</label>
                    <Dropdown
                      value={formRow.isDelayReasonRequired}
                      options={yesNoOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, isDelayReasonRequired: e.value }))}
                      className="w-100 border"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Time in Hours</label>
                    <InputText
                      value={formRow.timeInHours}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, timeInHours: e.target.value }))}
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Can Revert to Investor</label>
                    <Dropdown
                      value={formRow.canRevertToInvestor}
                      options={yesNoOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, canRevertToInvestor: e.value }))}
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Can Verify Document</label>
                    <Dropdown
                      value={formRow.canVerifyDocument}
                      options={yesNoOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, canVerifyDocument: e.value }))}
                      className="w-100 border"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Own Department</label>
                    <Dropdown
                      value={formRow.isOwnDepartment}
                      options={yesNoOptions}
                      onChange={(e) => setFormRow((prev) => ({ ...prev, isOwnDepartment: e.value }))}
                      className="w-100 border"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <Button
                    type="button"
                    label="Add"
                    icon="pi pi-plus"
                    severity="secondary"
                    onClick={handleAddOrUpdateRow}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="table-responsive border rounded">
                  <table className="table table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Processing Level</th>
                        <th>Current Role</th>
                        <th>Form Type</th>
                        <th>Next Role</th>
                        <th>Approver Role</th>
                        <th>Forward Role</th>
                        <th>Revert Role</th>
                        <th>Delay Reason</th>
                        <th>Time (Hours)</th>
                        <th>Revert to Investor</th>
                        <th>Verify Docs</th>
                        <th>Own Dept</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={13} className="text-center text-muted">
                            No rows added yet.
                          </td>
                        </tr>
                      )}
                      {rows
                        .slice()
                        .sort((a, b) => {
                          const idA = Number(a.id ?? Number.MAX_SAFE_INTEGER);
                          const idB = Number(b.id ?? Number.MAX_SAFE_INTEGER);
                          return idA - idB;
                        })
                        .map((row, index) => (
                          <tr key={row.id ?? `row-${index}`}>
                            <td>{row.processingLevel}</td>
                            <td>{getRoleLabel(row.currentRoleId)}</td>
                            <td>{getFormTypeLabel(row.formTypeId)}</td>
                            <td>{getRoleLabel(row.nextRoleId)}</td>
                            <td>{getRoleLabel(row.approverId)}</td>
                            <td>{getRoleLabel(row.forwardRoleId)}</td>
                            <td>{getRoleLabel(row.revertRoleId)}</td>
                            <td>{row.isDelayReasonRequired}</td>
                            <td>{row.timeInHours}</td>
                            <td>{row.canRevertToInvestor}</td>
                            <td>{row.canVerifyDocument}</td>
                            <td>{row.isOwnDepartment}</td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  icon="pi pi-pencil"
                                  text
                                  severity="info"
                                  type="button"
                                  onClick={() => {
                                    setEditingRowIndex(index);
                                    setFormRow({
                                      ...row,
                                      departmentId: selectedDepartmentId,
                                      serviceId: selectedServiceId,
                                    });
                                  }}
                                />
                                <Button
                                  icon="pi pi-trash"
                                  text
                                  severity="danger"
                                  type="button"
                                  onClick={() => {
                                    if (row.id) {
                                      setDeletedRowIds((prev) => [...prev, row.id as number]);
                                    }
                                    setRows((prev) => prev.filter((_, i) => i !== index));
                                    if (editingRowIndex === index) {
                                      setEditingRowIndex(null);
                                      setFormRow(buildDefaultRow(selectedDepartmentId, selectedServiceId));
                                    }
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="d-flex gap-2 mt-4">
            <Button
              label={editingServiceId ? 'Update' : 'Create'}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-grow-1"
              disabled={!selectedServiceId}
            />
            <Button label="Cancel" icon="pi pi-times" severity="secondary" type="button" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<WorkflowGroup>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
      />
    </div>
  );
};
