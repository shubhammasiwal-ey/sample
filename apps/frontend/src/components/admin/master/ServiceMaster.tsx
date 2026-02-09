'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleService,
} from '@/hooks/master/useServices';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useDocumentMasters } from '@/hooks/master/useDocumentMasters';
import { useDocumentTypes } from '@/hooks/master/useDocumentTypes';
import { useDocumentCheckpoints } from '@/hooks/master/useDocumentCheckpoints';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { exportToCSV, exportToExcel, exportToPDF, prepareModuleExportData } from '@/lib/export-utils';
import { serviceExportConfig } from '@/lib/export-configs';

type ServiceStatus =
  | "NOT_APPLICABLE"
  | "Integrated"
  | "Onboarded"
  | "Offline"
  | "ONLINE_ON_DEPT_PORTAL"
  | "";

interface Service {
  id: number;
  service_id: string;
  department_id: number;
  department_name ?: string;
  issuer_id?: number | null;
  issuer_name?: string | null;
  service_level?: string | null;
  document_checklist?: string | null;
  document_checklist_mapping?: any[] | null;
  document_type_mapping?: any[] | null;
  document_checkpoint_mapping?: any[] | null;
  comments?: string | null;
  service_name: string;
  service_url ?: string;
  development_url ?: string;
  is_in_SWCS_act:  boolean;
  description?:  string;
  is_integrated_with_dms:  boolean;
  service_status: ServiceStatus;
  service_go_live_date ?: string | null;
  service_end_date ?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


interface Service {
  id: number;
  service_id: string;
  department_id: number;
  department_name ?: string;
  issuer_id?: number | null;
  issuer_name?: string | null;
  service_level?: string | null;
  document_checklist?: string | null;
  document_checklist_mapping?: any[] | null;
  document_type_mapping?: any[] | null;
  document_checkpoint_mapping?: any[] | null;
  comments?: string | null;
  service_name: string;
  service_url ?: string;
  development_url ?: string;
  is_in_SWCS_act:  boolean;
  description?:  string;
  is_integrated_with_dms:  boolean;
  service_status: ServiceStatus;
  service_go_live_date ?: string | null;
  service_end_date ?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  service_id: string;
  department_id: number;
  issuer_id?: number | null;
  service_level: number[];
  document_checklist: string;
  document_checklist_mapping: any[];
  document_type_mapping: any[];
  document_checkpoint_mapping: any[];
  comments: string;
  service_name: string;
  service_url ?: string;
  development_url ?: string;
  is_in_SWCS_act: boolean;
  description?:  string;
  is_integrated_with_dms: boolean;
  service_status: ServiceStatus;
  service_go_live_date ?: string | null;
  service_end_date ?: string | null;
  isActive: boolean;
}

export const ServiceMaster = () => {
  /** 🔥 Fetch API Data */
  const { data: services = [], isLoading } = useServices();
  const { data: departments = [] } = useDepartments();
  const { data: issuers = [] } = useIssuers();
  const { data: documentMasters = [] } = useDocumentMasters();
  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: documentCheckpoints = [] } = useDocumentCheckpoints();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const toggleMutation = useToggleService();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [showViewChecklistDialog, setShowViewChecklistDialog] = useState(false);
  const [showViewDocTypeDialog, setShowViewDocTypeDialog] = useState(false);
  const [showViewCheckpointDialog, setShowViewCheckpointDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState('');
  const [docTypeSearch, setDocTypeSearch] = useState('');
  const [checkpointSearch, setCheckpointSearch] = useState('');
  const [serviceData, setformData] = useState<ServiceFormData>({
    service_id: "",
    department_id: 0,
    issuer_id: null,
    service_level: [],
    document_checklist: 'N',
    document_checklist_mapping: [],
    document_type_mapping: [],
    document_checkpoint_mapping: [],
    comments: '',
    service_name: "",
    service_url: "",
    development_url: "",
    is_in_SWCS_act: false,
    is_integrated_with_dms: false,
    service_status: "NOT_APPLICABLE",
    service_go_live_date: null,
    service_end_date: null,
    isActive: true,
  });

  const serviceLevelOptions = [
    { label: 'Pre-Establishment', value: 1 },
    { label: 'Pre-Operational', value: 2 },
    { label: 'Post-Operational', value: 3 },
  ];

  const normalizeMapping = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const isMapped = (
    field: 'document_checklist_mapping' | 'document_type_mapping',
    docId: number | string
  ) => {
    const docIdValue = String(docId);
    const list = serviceData[field] || [];
    return list.some((item: any) => item.doc_id === docIdValue);
  };

  const toggleMapping = (
    field: 'document_checklist_mapping' | 'document_type_mapping',
    docId: number | string,
    checked: boolean
  ) => {
    const docIdValue = String(docId);
    setformData((prev) => {
      const current = prev[field] || [];
      if (!checked) {
        return { ...prev, [field]: current.filter((item: any) => item.doc_id !== docIdValue) };
      }
      if (current.some((item: any) => item.doc_id === docIdValue)) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...current, { doc_id: docIdValue, is_required: 'N', doc_comment: '' }],
      };
    });
  };

  const updateMapping = (
    field: 'document_checklist_mapping' | 'document_type_mapping',
    docId: number | string,
    patch: { is_required?: 'Y' | 'N'; doc_comment?: string }
  ) => {
    const docIdValue = String(docId);
    setformData((prev) => {
      const current = prev[field] || [];
      const index = current.findIndex((item: any) => item.doc_id === docIdValue);
      const base =
        index >= 0
          ? current[index]
          : { doc_id: docIdValue, is_required: 'N', doc_comment: '' };
      const updated = { ...base, ...patch };
      const next =
        index >= 0
          ? current.map((item: any, idx: number) => (idx === index ? updated : item))
          : [...current, updated];
      return { ...prev, [field]: next };
    });
  };

  const updateCheckpointMapping = (
    docId: number | string,
    checkpointIds: number[],
  ) => {
    const docIdValue = String(docId);
    setformData((prev) => {
      const current = prev.document_checkpoint_mapping || [];
      const index = current.findIndex((item: any) => item.doc_id === docIdValue);
      const updated = { doc_id: docIdValue, checkpoint_ids: checkpointIds };
      const next =
        index >= 0
          ? current.map((item: any, idx: number) => (idx === index ? updated : item))
          : [...current, updated];
      return { ...prev, document_checkpoint_mapping: next };
    });
  };

  const isCheckpointMapped = (docId: number | string) => {
    const docIdValue = String(docId);
    const list = serviceData.document_checkpoint_mapping || [];
    return list.some((item: any) => item.doc_id === docIdValue);
  };

  const toggleCheckpointMapping = (docId: number | string, checked: boolean) => {
    const docIdValue = String(docId);
    setformData((prev) => {
      const current = prev.document_checkpoint_mapping || [];
      if (!checked) {
        return {
          ...prev,
          document_checkpoint_mapping: current.filter((item: any) => item.doc_id !== docIdValue),
        };
      }
      if (current.some((item: any) => item.doc_id === docIdValue)) {
        return prev;
      }
      return {
        ...prev,
        document_checkpoint_mapping: [...current, { doc_id: docIdValue, checkpoint_ids: [] }],
      };
    });
  };

  const getMappingValue = (
    field: 'document_checklist_mapping' | 'document_type_mapping',
    docId: number | string
  ) => {
    const docIdValue = String(docId);
    const list = serviceData[field] || [];
    return (
      list.find((item: any) => item.doc_id === docIdValue) || {
        doc_id: docIdValue,
        is_required: 'N',
        doc_comment: '',
      }
    );
  };

  const getCheckpointMappingValue = (docId: number | string) => {
    const docIdValue = String(docId);
    const list = serviceData.document_checkpoint_mapping || [];
    return (
      list.find((item: any) => item.doc_id === docIdValue) || {
        doc_id: docIdValue,
        checkpoint_ids: [],
      }
    );
  };

  const filteredChecklistDocs = useMemo(() => {
    if (!checklistSearch.trim()) return documentMasters;
    const term = checklistSearch.toLowerCase();
    return documentMasters.filter((doc: any) => {
      return (
        String(doc.checklistId || '').toLowerCase().includes(term) ||
        String(doc.checklistDocumentName || '').toLowerCase().includes(term) ||
        String(doc.documentType?.name || '').toLowerCase().includes(term) ||
        String(doc.issuer?.name || '').toLowerCase().includes(term)
      );
    });
  }, [documentMasters, checklistSearch]);

  const filteredChecklistDocsForCheckpoint = useMemo(() => {
    if (!checkpointSearch.trim()) return documentMasters;
    const term = checkpointSearch.toLowerCase();
    return documentMasters.filter((doc: any) => {
      return (
        String(doc.checklistId || '').toLowerCase().includes(term) ||
        String(doc.checklistDocumentName || '').toLowerCase().includes(term)
      );
    });
  }, [documentMasters, checkpointSearch]);

  const filteredDocTypes = useMemo(() => {
    if (!docTypeSearch.trim()) return documentTypes;
    const term = docTypeSearch.toLowerCase();
    return documentTypes.filter((doc: any) => {
      return (
        String(doc.abbreviation || '').toLowerCase().includes(term) ||
        String(doc.name || '').toLowerCase().includes(term)
      );
    });
  }, [documentTypes, docTypeSearch]);

  const filteredCheckpoints = useMemo(() => {
    if (!checkpointSearch.trim()) return documentCheckpoints;
    const term = checkpointSearch.toLowerCase();
    return documentCheckpoints.filter((doc: any) => {
      return (
        String(doc.code || '').toLowerCase().includes(term) ||
        String(doc.name || '').toLowerCase().includes(term)
      );
    });
  }, [documentCheckpoints, checkpointSearch]);

  const activeIssuers = useMemo(
    () => issuers.filter((issuer) => issuer.isIssuerActive),
    [issuers]
  );

  const selectedChecklistMapping = useMemo(
    () =>
      selectedService
        ? normalizeMapping(selectedService.document_checklist_mapping)
        : [],
    [selectedService]
  );
  const selectedDocTypeMapping = useMemo(
    () =>
      selectedService ? normalizeMapping(selectedService.document_type_mapping) : [],
    [selectedService]
  );
  const selectedCheckpointMapping = useMemo(
    () =>
      selectedService
        ? normalizeMapping(selectedService.document_checkpoint_mapping)
        : [],
    [selectedService]
  );

  const filteredDepartments = useMemo(() => {
    if (!serviceData.issuer_id) return departments;
    return departments.filter((dept: any) => {
      const issuerId = dept.issuerId ?? dept.issuer?.id ?? null;
      return issuerId === serviceData.issuer_id;
    });
  }, [departments, serviceData.issuer_id]);

  /** 🔥 Memoize incoming server data */
  const initialData = useMemo(() => services, [services]);

  /** 🔥 Use DataTable Manager Hook */
  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Service>(initialData);

  /** 🔥 Table Configuration */
  const tableConfig: ReusableDataTableConfig<Service> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'service_id',
          header: 'Service ID',
          width: '12%',
          filterType: 'text',
          body: (row) => row.service_id || 'N/A',
        },
        {
          field: 'service_name',
          header: 'Service Name',
          width: '35%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.service_name}</span>,
        },
        {
          field: 'service_level',
          header: 'Service Level',
          width: '16%',
          filterType: 'text',
          body: (row) => row.service_level || 'N/A',
        },
        {
          field: 'department_name',
          header: 'Department',
          width: '20%',
          filterType: 'text',
        },
        {
          field: 'issuer_name',
          header: 'Issuer Type',
          width: '10%',
          filterType: 'text',
          body: (row) => row.issuer_name || 'N/A',
        },
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
          header: 'Created Date',
          width: '10%',
          filterType: 'date',
          body: (row) => new Date(row.createdAt).toLocaleDateString('en-IN'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['service_name'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Service found.',
    }),
    []
  );


  /** 🔥 Input Change */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    const numericFields = ['department_id', 'issuer_id'];
    setformData({
      ...serviceData,
      [name]:
        type === 'checkbox'
          ? checked
          : numericFields.includes(name)
          ? value === ''
            ? null
            : Number(value)
          : value,
    });
  };

  /** 🔥 Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        ...serviceData,
        service_level: serviceData.service_level.length
          ? serviceData.service_level.join(',')
          : undefined,
        document_checklist_mapping:
          serviceData.document_checklist === 'Y'
            ? serviceData.document_checklist_mapping
            : [],
        document_type_mapping:
          serviceData.document_checklist === 'Y'
            ? serviceData.document_type_mapping
            : [],
        document_checkpoint_mapping:
          serviceData.document_checklist === 'Y'
            ? serviceData.document_checkpoint_mapping
            : [],
      };
      if (serviceData.service_go_live_date) { 
        submitData.service_go_live_date = new Date(serviceData.service_go_live_date).toISOString();
      } else {
        delete submitData.service_go_live_date;
      }
  
      if (serviceData.service_end_date) {
        submitData.service_end_date = new Date(serviceData.service_end_date).toISOString();
      } else {
        delete submitData.service_end_date;
      }

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service updated successfully' });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service created successfully' });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error saving service' });
    }
  };

  /** 🔥 Edit */
  const handleEdit = (service: Service) => {
    const formatDateForInput = (date?: string | null) => {
      if (!date) return null;
      return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const parsedLevels = service.service_level
      ? service.service_level
          .split(',')
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value))
      : [];

    const issuerId =
      service.issuer_id ?? (service as any).department?.issuerId ?? null;

    setformData({
      service_id: service.service_id,
      department_id: service.department_id,
      issuer_id: issuerId,
      service_level: parsedLevels,
      document_checklist: service.document_checklist || 'N',
      document_checklist_mapping: normalizeMapping(service.document_checklist_mapping),
      document_type_mapping: normalizeMapping(service.document_type_mapping),
      document_checkpoint_mapping: normalizeMapping(service.document_checkpoint_mapping),
      comments: service.comments || '',
      service_name: service.service_name,
      service_url: service.service_url,
      development_url: service.development_url,
      is_in_SWCS_act: service.is_in_SWCS_act,
      is_integrated_with_dms: service.is_integrated_with_dms,
      service_status: service.service_status,
      service_go_live_date: formatDateForInput(service.service_go_live_date),
      service_end_date: formatDateForInput(service.service_end_date),
      isActive: service.isActive,
    });

    setEditingId(service.id);
    setShowDialog(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setShowViewDialog(true);
  };

  /** 🔥 Delete */
  const handleDelete = async (service: Service) => {
    if (confirm(`Are you sure you want to delete ${service.service_name}?`)) {
      try {
        await deleteMutation.mutateAsync(service.id);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service deleted successfully' });
      } catch (err) {
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error deleting service' });
      }
    }
  };

  /** 🔥 Toggle */
  const handleToggle = async (service: Service) => {
    try {
      await toggleMutation.mutateAsync(service.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Service ${service.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error updating service status' });
    }
  };

  
  /** 🔥 Row Actions */
  const rowActions: RowAction<Service>[] = [
    { icon: 'pi pi-eye', label: 'View', severity: 'secondary', onClick: handleView, tooltip: 'View Details' },
    { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: handleEdit, tooltip: 'Edit' },
    {
      icon: 'pi pi-check',
      label: 'Toggle',
      severity: 'success',
      onClick: handleToggle,
      tooltip: 'Toggle Status',
      visible: (s) => !s.isActive,
    },
    {
      icon: 'pi pi-times',
      label: 'Deactivate',
      severity: 'warn',
      onClick: handleToggle,
      tooltip: 'Deactivate',
      visible: (s) => s.isActive,
    },
    { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: handleDelete, tooltip: 'Delete' },
  ];


  /** 🔥 Reset Form */
  const resetForm = () => {
    setformData({
      service_id: '',
      department_id: 0,
      issuer_id: null,
      service_level: [],
      document_checklist: 'N',
      document_checklist_mapping: [],
      document_type_mapping: [],
      document_checkpoint_mapping: [],
      comments: '',
      service_name: '',
      service_url: '',
      development_url: '',
      is_in_SWCS_act: false,
      is_integrated_with_dms: false,
      service_end_date: null,
      service_go_live_date: null,
      service_status: 'NOT_APPLICABLE',
      isActive: true,
    });

    setEditingId(null);
  };

  /** 🔥 Export handlers */
  const handleExportCSV = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      exportToCSV(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `CSV exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      await exportToExcel(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `Excel exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      exportToPDF(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `PDF exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  /** 🔥 Toolbar templates */
  const leftToolbarTemplate = () => (
    <Button
      label="Add Service"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  );

  const rightToolbarTemplate = () => (
    <div className="d-flex gap-2">
      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" outlined onClick={() => { clearFilters(); handleGlobalFilterChange(''); handleFiltersChange({}); }} />
      <Button label="CSV" icon="pi pi-download" severity="info" rounded onClick={handleExportCSV} loading={exporting} disabled={isLoading} />
      <Button label="Excel" icon="pi pi-file-excel" severity="success" rounded onClick={handleExportExcel} loading={exporting} disabled={isLoading} />
      <Button label="PDF" icon="pi pi-file-pdf" severity="warning" rounded onClick={handleExportPDF} loading={exporting} disabled={isLoading} />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Service Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Service' : 'Add New Service'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="service_id" className="form-label">Service ID</label>
            <InputText id="service_id" name="service_id" value={serviceData.service_id} onChange={handleInputChange} placeholder="Enter Service ID" className="w-100" />
          </div>

          <div className="mb-3">
            <label className="form-label">Issuer Type *</label>
            <select
              name="issuer_id"
              className="form-select"
              value={serviceData.issuer_id ?? ''}
              onChange={(e) => {
                const issuerId = e.target.value === '' ? null : Number(e.target.value);
                setformData({
                  ...serviceData,
                  issuer_id: issuerId,
                  department_id: 0,
                });
              }}
              required
            >
              <option value="">Select Issuer Type</option>
              {activeIssuers.map((issuer) => (
                <option key={issuer.id} value={issuer.id}>
                  {issuer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Department *</label>
            <select
              name="department_id"
              className="form-select"
              value={serviceData.department_id ?? ''}
              onChange={handleInputChange}
              required
              disabled={!serviceData.issuer_id}
            >
              <option value="">
                {serviceData.issuer_id ? 'Select Department' : 'Select Issuer Type first'}
              </option>
              {filteredDepartments?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">Service Name *</label>
            <InputText id="name" name="service_name" value={serviceData.service_name} onChange={handleInputChange} placeholder="Enter Service Name" className="w-100" required />
          </div>

          <div className="mb-3">
            <label htmlFor="service_url" className="form-label">Service URL</label>
            <InputText id="service_url" name="service_url" value={serviceData.service_url} onChange={handleInputChange} placeholder="Enter Service URL" className="w-100" />
          </div>

          <div className="mb-3">
            <label htmlFor="development_url" className="form-label">Development URL</label>
            <InputText id="development_url" name="development_url" value={serviceData.development_url} onChange={handleInputChange} placeholder="Enter Development URL" className="w-100" />
          </div>

          <div className="mb-3">
            <label className="form-label">Service Level *</label>
            <MultiSelect
              value={serviceData.service_level}
              options={serviceLevelOptions}
              display="chip"
              className="w-100"
              placeholder="Select Service Level"
              onChange={(e) =>
                setformData({ ...serviceData, service_level: e.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Service Status *</label>
            <select name="service_status"  className="form-select"  value={serviceData.service_status}  onChange={handleInputChange}  required>
              <option value="">Select Service Status</option>
              <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
              <option value="ONLINE_ON_DEPT_PORTAL">Online on Department Portal</option>
              <option value="INTEGRATED">Integrated</option>
              <option value="ONBOARDED">Onboarded</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Service Go-Live Date</label>
            <input
              type="date"
              name="service_go_live_date"
              className="form-control"
              value={serviceData.service_go_live_date ?? ''}
              onChange={(e) =>
                setformData({
                  ...serviceData,
                  service_go_live_date: e.target.value || null,
                })
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Service End Date</label>
            <input
              type="date"
              name="service_end_date"
              className="form-control"
              value={serviceData.service_end_date ?? ''}
              onChange={(e) =>
                setformData({
                  ...serviceData,
                  service_end_date: e.target.value || null,
                })
              }
            />
          </div>

          
          <div className="mb-3 form-check">
            <input id="is_in_SWCS_act" name="is_in_SWCS_act" type="checkbox" className="form-check-input" checked={serviceData.is_in_SWCS_act} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="is_in_SWCS_act">Is in SWCS Act</label>
          </div>

          <div className="mb-3 form-check">
            <input id="is_integrated_with_dms" name="is_integrated_with_dms" type="checkbox" className="form-check-input" checked={serviceData.is_integrated_with_dms} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="is_integrated_with_dms">Is Integrated with DMS</label>
          </div>

          <div className="mb-3">
            <label className="form-label">Document Checklist Available</label>
            <select
              name="document_checklist"
              className="form-select"
              value={serviceData.document_checklist}
              onChange={handleInputChange}
            >
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </div>

          {serviceData.document_checklist === 'Y' && (
            <>
              <div className="mb-3 d-flex flex-wrap gap-2">
                <Button
                  label="View Document Checklist"
                  severity="info"
                  onClick={() => setShowChecklistDialog(true)}
                  type="button"
                />
                <Button
                  label="View Document Type"
                  severity="secondary"
                  onClick={() => setShowDocTypeDialog(true)}
                  type="button"
                />
                <Button
                  label="Checkpoint Mapping"
                  severity="success"
                  onClick={() => setShowCheckpointDialog(true)}
                  type="button"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Comments</label>
                <InputText
                  name="comments"
                  value={serviceData.comments}
                  onChange={handleInputChange}
                  placeholder="Enter comments"
                  className="w-100"
                />
              </div>
            </>
          )}

          <div className="mb-3 form-check">
            <input id="isActive" name="isActive" type="checkbox" className="form-check-input" checked={serviceData.isActive} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="isActive">Active</label>
          </div>

          <div className="d-flex gap-2">
            <Button label={editingId ? 'Update' : 'Create'} icon="pi pi-check" type="submit" loading={createMutation.isPending || updateMutation.isPending} className="flex-grow-1" />
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <Dialog
        visible={showChecklistDialog}
        onHide={() => setShowChecklistDialog(false)}
        header="Documents CheckList"
        modal
        style={{ width: '80vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong>Document Checklist Mapping</strong>
          <InputText
            value={checklistSearch}
            onChange={(e) => setChecklistSearch(e.target.value)}
            placeholder="Search in documents"
            className="w-50"
          />
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '80px' }}>Select</th>
                <th style={{ width: '140px' }}>Document Code</th>
                <th>Document Type</th>
                <th style={{ width: '160px' }}>Issued By</th>
                <th>Document Name</th>
                <th style={{ width: '100px' }}>Is Required</th>
                <th style={{ width: '220px' }}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecklistDocs.map((doc: any, index: number) => {
                const mapping = getMappingValue('document_checklist_mapping', doc.id);
                const selected = isMapped('document_checklist_mapping', doc.id);
                return (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          toggleMapping('document_checklist_mapping', doc.id, e.target.checked)
                        }
                      />
                    </td>
                    <td>{doc.checklistId || 'N/A'}</td>
                    <td>{doc.documentType?.name || 'N/A'}</td>
                    <td>{doc.issuer?.name || 'N/A'}</td>
                    <td>{doc.checklistDocumentName || 'N/A'}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={mapping.is_required || 'N'}
                        disabled={!selected}
                        onChange={(e) =>
                          updateMapping('document_checklist_mapping', doc.id, {
                            is_required: e.target.value as 'Y' | 'N',
                          })
                        }
                      >
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <InputText
                        value={mapping.doc_comment || ''}
                        disabled={!selected}
                        onChange={(e) =>
                          updateMapping('document_checklist_mapping', doc.id, {
                            doc_comment: e.target.value,
                          })
                        }
                        className="w-100"
                        placeholder="Comment"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <Button label="Done" onClick={() => setShowChecklistDialog(false)} />
        </div>
      </Dialog>

      <Dialog
        visible={showDocTypeDialog}
        onHide={() => setShowDocTypeDialog(false)}
        header="Map Document Types with Service"
        modal
        style={{ width: '70vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong>Document Type Mapping</strong>
          <InputText
            value={docTypeSearch}
            onChange={(e) => setDocTypeSearch(e.target.value)}
            placeholder="Search in document types"
            className="w-50"
          />
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '80px' }}>Select</th>
                <th style={{ width: '160px' }}>Document Abbreviation</th>
                <th>Document Type</th>
                <th style={{ width: '120px' }}>Is Mandatory</th>
                <th style={{ width: '220px' }}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocTypes.map((doc: any, index: number) => {
                const mapping = getMappingValue('document_type_mapping', doc.id);
                const selected = isMapped('document_type_mapping', doc.id);
                return (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          toggleMapping('document_type_mapping', doc.id, e.target.checked)
                        }
                      />
                    </td>
                    <td>{doc.abbreviation || 'N/A'}</td>
                    <td>{doc.name || 'N/A'}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={mapping.is_required || 'N'}
                        disabled={!selected}
                        onChange={(e) =>
                          updateMapping('document_type_mapping', doc.id, {
                            is_required: e.target.value as 'Y' | 'N',
                          })
                        }
                      >
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <InputText
                        value={mapping.doc_comment || ''}
                        disabled={!selected}
                        onChange={(e) =>
                          updateMapping('document_type_mapping', doc.id, {
                            doc_comment: e.target.value,
                          })
                        }
                        className="w-100"
                        placeholder="Comment"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <Button label="Done" onClick={() => setShowDocTypeDialog(false)} />
        </div>
      </Dialog>

      <Dialog
        visible={showCheckpointDialog}
        onHide={() => setShowCheckpointDialog(false)}
        header="Checkpoint Mapping"
        modal
        style={{ width: '70vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong>Document Checkpoint Mapping</strong>
          <InputText
            value={checkpointSearch}
            onChange={(e) => setCheckpointSearch(e.target.value)}
            placeholder="Search in checkpoints"
            className="w-50"
          />
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '80px' }}>Select</th>
                <th style={{ width: '160px' }}>Document Code</th>
                <th>Document Name</th>
                <th style={{ width: '320px' }}>Checkpoints</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecklistDocsForCheckpoint.map((doc: any, index: number) => {
                const mapping = getCheckpointMappingValue(doc.id);
                const selected = isCheckpointMapped(doc.id);
                return (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          toggleCheckpointMapping(doc.id, e.target.checked)
                        }
                      />
                    </td>
                    <td>{doc.checklistId || 'N/A'}</td>
                    <td>{doc.checklistDocumentName || 'N/A'}</td>
                    <td>
                      <MultiSelect
                        value={mapping.checkpoint_ids || []}
                        options={documentCheckpoints.map((cp: any) => ({
                          label: `${cp.code} - ${cp.name}`,
                          value: cp.id,
                        }))}
                        display="chip"
                        className="w-100"
                        placeholder="Select Checkpoints"
                        disabled={!selected}
                        onChange={(e) =>
                          updateCheckpointMapping(doc.id, e.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <Button label="Done" onClick={() => setShowCheckpointDialog(false)} />
        </div>
      </Dialog>

      <Dialog
        visible={showViewDialog}
        onHide={() => setShowViewDialog(false)}
        header="Service Details"
        modal
        style={{ width: '55vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        {selectedService ? (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="fw-semibold">Service ID</div>
              <div>{selectedService.service_id || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Name</div>
              <div>{selectedService.service_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Department</div>
              <div>{selectedService.department_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Issuer Type</div>
              <div>{selectedService.issuer_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Level</div>
              <div>{selectedService.service_level || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Status</div>
              <div>{selectedService.service_status || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Document Checklist Available</div>
              <div>{selectedService.document_checklist === 'Y' ? 'Yes' : 'No'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Document Checklist</div>
              <Button
                label="View Document Checklist"
                severity="info"
                onClick={() => setShowViewChecklistDialog(true)}
                size="small"
                disabled={selectedChecklistMapping.length === 0}
              />
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Document Types</div>
              <Button
                label="View Document Types"
                severity="secondary"
                onClick={() => setShowViewDocTypeDialog(true)}
                size="small"
                disabled={selectedDocTypeMapping.length === 0}
              />
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Document Checkpoints</div>
              <Button
                label="View Checkpoints"
                severity="success"
                onClick={() => setShowViewCheckpointDialog(true)}
                size="small"
                disabled={selectedCheckpointMapping.length === 0}
              />
            </div>
            <div className="col-md-12">
              <div className="fw-semibold">Comments</div>
              <div>{selectedService.comments || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service URL</div>
              <div>{selectedService.service_url || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Development URL</div>
              <div>{selectedService.development_url || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">SWCS Act</div>
              <div>{selectedService.is_in_SWCS_act ? 'Yes' : 'No'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Integrated with DMS</div>
              <div>{selectedService.is_integrated_with_dms ? 'Yes' : 'No'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Go-Live Date</div>
              <div>
                {selectedService.service_go_live_date
                  ? new Date(selectedService.service_go_live_date).toLocaleDateString('en-IN')
                  : 'N/A'}
              </div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">End Date</div>
              <div>
                {selectedService.service_end_date
                  ? new Date(selectedService.service_end_date).toLocaleDateString('en-IN')
                  : 'N/A'}
              </div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Status</div>
              <div>{selectedService.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted">No details available.</div>
        )}
      </Dialog>

      <Dialog
        visible={showViewChecklistDialog}
        onHide={() => setShowViewChecklistDialog(false)}
        header="Documents CheckList"
        modal
        style={{ width: '80vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '140px' }}>Document Code</th>
                <th>Document Type</th>
                <th style={{ width: '160px' }}>Issued By</th>
                <th>Document Name</th>
                <th style={{ width: '100px' }}>Is Required</th>
                <th style={{ width: '220px' }}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {selectedChecklistMapping.map((mapping: any, index: number) => {
                const doc = documentMasters.find((item: any) => String(item.id) === String(mapping.doc_id));
                return (
                  <tr key={`${mapping.doc_id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{doc?.checklistId || 'N/A'}</td>
                    <td>{doc?.documentType?.name || 'N/A'}</td>
                    <td>{doc?.issuer?.name || 'N/A'}</td>
                    <td>{doc?.checklistDocumentName || 'N/A'}</td>
                    <td>{mapping.is_required || 'N'}</td>
                    <td>{mapping.doc_comment || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Dialog>

      <Dialog
        visible={showViewDocTypeDialog}
        onHide={() => setShowViewDocTypeDialog(false)}
        header="Document Types"
        modal
        style={{ width: '70vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '160px' }}>Document Abbreviation</th>
                <th>Document Type</th>
                <th style={{ width: '120px' }}>Is Mandatory</th>
                <th style={{ width: '220px' }}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {selectedDocTypeMapping.map((mapping: any, index: number) => {
                const docType = documentTypes.find((item: any) => String(item.id) === String(mapping.doc_id));
                return (
                  <tr key={`${mapping.doc_id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{docType?.abbreviation || 'N/A'}</td>
                    <td>{docType?.name || 'N/A'}</td>
                    <td>{mapping.is_required || 'N'}</td>
                    <td>{mapping.doc_comment || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Dialog>

      <Dialog
        visible={showViewCheckpointDialog}
        onHide={() => setShowViewCheckpointDialog(false)}
        header="Document Checkpoints"
        modal
        style={{ width: '70vw' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      >
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th style={{ width: '160px' }}>Document Code</th>
                <th>Document Name</th>
                <th style={{ width: '320px' }}>Checkpoints</th>
              </tr>
            </thead>
            <tbody>
              {selectedCheckpointMapping.map((mapping: any, index: number) => {
                const doc = documentMasters.find((item: any) => String(item.id) === String(mapping.doc_id));
                const checkpointNames = Array.isArray(mapping.checkpoint_ids)
                  ? mapping.checkpoint_ids
                      .map((id: number) => documentCheckpoints.find((cp: any) => cp.id === id))
                      .filter(Boolean)
                      .map((cp: any) => `${cp.code} - ${cp.name}`)
                  : [];
                return (
                  <tr key={`${mapping.doc_id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{doc?.checklistId || 'N/A'}</td>
                    <td>{doc?.checklistDocumentName || 'N/A'}</td>
                    <td>{checkpointNames.length ? checkpointNames.join(', ') : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Dialog>

      <ReusableDataTable<Service>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
      />
    </div>
  );
};
