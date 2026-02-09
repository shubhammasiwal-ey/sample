
'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useTranslations } from 'next-intl';

import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { useExportHandler } from '@/hooks/useExportHandler';
import { investorDocumentExportConfig } from '@/lib/export-configs';

import {
  useInvestorDocuments,
  useCreateInvestorDocument,
  useUpdateInvestorDocument,
  useDeleteInvestorDocument,
  useDocumentStats,
  useUploadInvestorDocument,
  InvestorDocument,
  CreateInvestorDocumentDto,
  UpdateInvestorDocumentDto,
} from '@/hooks/investor/document/useInvestorDocuments';

import { useDocumentTypes } from '@/hooks/master/useDocumentTypes';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useDocumentMasters } from '@/hooks/master/useDocumentMasters';

/** Utility: format date as "24 Mar 2025" for table cells */
const formatDate = (iso?: string | Date | null) => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** ---- DATE HELPERS (timezone-safe) ---- */
/** Build YYYY-MM-DD from local date components (never uses toISOString) */
const toYMDLocal = (date?: Date | null): string | undefined => {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse 'YYYY-MM-DD' into a local Date (no timezone shift) */
const parseYMDToLocalDate = (ymd?: string | null): Date | null => {
  if (!ymd) return null;
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    const d = new Date(ymd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, monthIndex, day, 0, 0, 0, 0); // local midnight
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Compare two local date-only strings 'YYYY-MM-DD' */
const cmpYMD = (a?: string, b?: string): number => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

type FormState = {
  documentMasterId: number | null;
  documentTypeId: number | null;
  issuerId: number | null;
  departmentId: number | null;
  documentName: string;
  documentPath: string;
  validFrom?: Date | null;
  validTo?: Date | null;
  documentDateOfIssuance?: Date | null;
  comments?: string;
  file?: File | null;
};

type DateErrors = {
  validFrom?: string;
  validTo?: string;
  documentDateOfIssuance?: string;
};

/** Allowed MIME types for upload */
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Upload response structure (aligned with backend upload controller) */
type UploadResponse = {
  success: boolean;
  message: string;
  data: {
    filePath: string;
    fileName: string;
    originalName: string;
    size: number;
    mimetype: string;
    documentReferenceNumber: string; // e.g., 19460403_UK-DCL-998_V1.6
    documentVersion: string;         // e.g., V1.6
    originalSizeBytes?: number;
    compressedSizeBytes?: number;
    savedBytes?: number;
    savedPercent?: number;
  };
};

export default function InvestorDocuments() {
  /** ✅ Correct ref typing: refs are null until mounted */
  const toastRef = useRef<Toast | null>(null);
  const t = useTranslations('InvestorDocuments');

  // Data & mutations
  const { data: docs = [], isLoading } = useInvestorDocuments();
  const createMutation = useCreateInvestorDocument();
  const updateMutation = useUpdateInvestorDocument();
  const deleteMutation = useDeleteInvestorDocument();
  const uploadMutation = useUploadInvestorDocument();
  const { data: stats } = useDocumentStats();

  // Masters
  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: issuers = [] } = useIssuers();
  const { data: departments = [] } = useDepartments();
  const { data: docMasters = [] } = useDocumentMasters();

  // Dialog / form state
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    documentMasterId: null,
    documentTypeId: null,
    issuerId: null,
    departmentId: null,
    documentName: '',
    documentPath: '',
    validFrom: null,
    validTo: null,
    documentDateOfIssuance: null,
    comments: '',
    file: null,
  });

  const [isValidityRequired, setIsValidityRequired] = useState<boolean>(false);
  const [dateErrors, setDateErrors] = useState<DateErrors>({});

  /** Compression summary (if backend returns stats) */
  const [compressionSummary, setCompressionSummary] = useState<{
    originalSizeBytes?: number;
    compressedSizeBytes?: number;
    savedPercent?: number;
    mimeType?: string;
  } | null>(null);

  // Dependent filtering logic
  const eligibleDepartmentIds = useMemo(() => {
    if (!formData.documentTypeId || !formData.issuerId) return [];
    const ids = docMasters
      .filter(
        (dm: any) =>
          dm.documentTypeId === formData.documentTypeId &&
          dm.issuerId === formData.issuerId
      )
      .map((dm: any) => dm.departmentId);
    return Array.from(new Set(ids));
  }, [formData.documentTypeId, formData.issuerId, docMasters]);

  const filteredDepartments = useMemo(
    () => departments.filter((d: any) => eligibleDepartmentIds.includes(d.id)),
    [departments, eligibleDepartmentIds]
  );

  const filteredDocMasters = useMemo(() => {
    if (!formData.documentTypeId || !formData.issuerId || !formData.departmentId) return [];
    return docMasters.filter(
      (dm: any) =>
        dm.documentTypeId === formData.documentTypeId &&
        dm.issuerId === formData.issuerId &&
        dm.departmentId === formData.departmentId
    );
  }, [docMasters, formData.documentTypeId, formData.issuerId, formData.departmentId]);

  // Validity required flag
  useEffect(() => {
    if (formData.documentMasterId) {
      const master = docMasters.find((m: any) => m.id === formData.documentMasterId);
      setIsValidityRequired(!!master?.isDocValidityRequired);
    } else {
      setIsValidityRequired(false);
    }
  }, [formData.documentMasterId, docMasters]);

  // DataTable Manager
  const {
    data: tableData,
    selectedRows,
    filteredData,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<InvestorDocument>(docs);

  // Export handlers
  // ⬇️ If your hook expects RefObject<Toast>, assert the type at the call-site.
  // We still guard all runtime usages with `toastRef.current?.show(...)`.
  const { handleExportCSV, handleExportExcel, handleExportPDF } =
    useExportHandler(investorDocumentExportConfig, toastRef as React.RefObject<Toast>);

  // Helpers
  const statusTag = (s: InvestorDocument['documentStatus']) =>
    s === 'U' ? <Tag value={t('status.unverified')} severity="secondary" /> :
      s === 'V' ? <Tag value={t('status.verified')} severity="success" /> :
        s === 'R' ? <Tag value={t('status.rejected')} severity="danger" /> :
          s === 'M' ? <Tag value={t('status.mismatched')} severity="info" /> :
            <Tag value={s} />;

  const yesNoTag = (v: string) => (
    <Tag
      value={v === 'Y' ? t('common.yes') : t('common.no')}
      severity={v === 'Y' ? 'success' : 'danger'}
    />
  );

  // ---- DATE VALIDATION ----
  const validateDates = useCallback((): { ok: boolean; errors: DateErrors } => {
    const errs: DateErrors = {};
    if (isValidityRequired) {
      const ymdFrom = toYMDLocal(formData.validFrom);
      const ymdTo = toYMDLocal(formData.validTo);
      const ymdIssued = toYMDLocal(formData.documentDateOfIssuance);

      if (!ymdFrom) errs.validFrom = t('errors.validFromRequired');
      if (!ymdTo) errs.validTo = t('errors.validToRequired');
      if (!ymdIssued) errs.documentDateOfIssuance = t('errors.issuedOnRequired');

      if (ymdFrom && ymdTo && cmpYMD(ymdTo, ymdFrom) < 0) {
        errs.validTo = t('errors.validToEarlier');
      }
      if (ymdIssued && ymdFrom && cmpYMD(ymdIssued, ymdFrom) > 0) {
        errs.documentDateOfIssuance = t('errors.issuedAfterFrom');
      }
      if (ymdIssued && ymdTo && cmpYMD(ymdIssued, ymdTo) > 0) {
        errs.documentDateOfIssuance = t('errors.issuedAfterTo');
      }
    }
    return { ok: Object.keys(errs).length === 0, errors: errs };
  }, [isValidityRequired, formData.validFrom, formData.validTo, formData.documentDateOfIssuance, t]);

  const clearDateError = (field: keyof DateErrors) => {
    setDateErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Table config
  const tableConfig: ReusableDataTableConfig<InvestorDocument> = useMemo(
    () => ({
      columns: [
        {
          field: 'documentReferenceNumber',
          header: t('table.reference'),
          width: '22%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => <span className="fw-semibold">{row.documentReferenceNumber}</span>,
        },
        { field: 'documentName', header: t('table.name'), width: '16%', filterType: 'text', filterMatchMode: 'contains' },
        { field: 'documentVersion', header: t('table.version'), width: '10%', filterType: 'text', filterMatchMode: 'contains' },
        {
          field: 'documentStatus',
          header: t('table.status'),
          width: '12%',
          filterType: 'select',
          filterOptions: [
            { label: t('status.unverified'), value: 'U' },
            { label: t('status.verified'), value: 'V' },
            { label: t('status.rejected'), value: 'R' },
            { label: t('status.mismatched'), value: 'M' },
          ],
          body: (row) => statusTag(row.documentStatus),
        },
        {
          field: 'documentType.name',
          header: t('table.type'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.documentType?.name ?? '—',
        },
        {
          field: 'issuer.name',
          header: t('table.issuer'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.issuer?.name ?? '—',
        },
        {
          field: 'department.name',
          header: t('table.department'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.department?.name ?? '—',
        },
        {
          field: 'isDocumentActive',
          header: t('table.active'),
          width: '10%',
          filterType: 'select',
          filterOptions: [{ label: t('common.yes'), value: 'Y' }, { label: t('common.no'), value: 'N' }],
          body: (row) => yesNoTag(row.isDocumentActive),
        },
        {
          field: 'validFrom',
          header: t('table.validFrom'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.validFrom),
        },
        {
          field: 'validTo',
          header: t('table.validTo'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.validTo),
        },
        {
          field: 'documentDateOfIssuance',
          header: t('table.issuedOn'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.documentDateOfIssuance),
        },
        {
          field: 'createdAt',
          header: t('table.created'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.createdAt),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['documentReferenceNumber', 'documentName', 'issuer.name', 'department.name', 'documentType.name'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: t('table.empty'),
    }),
    [t],
  );

  // Handlers
  const handleEdit = useCallback((row: InvestorDocument) => {
    const toLocal = (value?: string | Date | null) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const justDate = value.includes('T') ? value.split('T')[0] : value;
        return parseYMDToLocalDate(justDate);
      }
      return value instanceof Date ? value : new Date(value);
    };

    setFormData({
      documentMasterId: row.documentMasterId,
      documentTypeId: row.documentTypeId,
      issuerId: row.issuerId,
      departmentId: row.departmentId,
      documentName: row.documentName,
      documentPath: row.documentPath,
      validFrom: toLocal(row.validFrom),
      validTo: toLocal(row.validTo),
      documentDateOfIssuance: toLocal(row.documentDateOfIssuance),
      comments: row.comments ?? '',
      file: null,
    });
    setEditingId(row.id);
    setDateErrors({});
    setCompressionSummary(null);
    setShowDialog(true);
  }, []);

  const handleInputChange = useCallback((e: any) => {
    const { name, value } = e.target || e;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'documentTypeId') {
        next.documentTypeId = Number(value) || null;
        next.departmentId = null;
        next.documentMasterId = null;
      }
      if (name === 'issuerId') {
        next.issuerId = Number(value) || null;
        next.departmentId = null;
        next.documentMasterId = null;
      }
      if (name === 'departmentId') {
        next.departmentId = Number(value) || null;
        next.documentMasterId = null;
      }
      if (name === 'documentMasterId') {
        next.documentMasterId = Number(value) || null;
      }
      return next;
    });
  }, []);

  const handleDateChange = (field: keyof FormState, value: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'validFrom') clearDateError('validFrom');
    if (field === 'validTo') clearDateError('validTo');
    if (field === 'documentDateOfIssuance') clearDateError('documentDateOfIssuance');
  };

  /** Validate file type on selection */
  const handleFileChange = (file: File | null) => {
    setCompressionSummary(null);
    if (!file) {
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }
    const mime = file.type || '';
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      setFormData((prev) => ({ ...prev, file: null }));
      toastRef.current?.show({
        severity: 'warn',
        summary: t('toasts.unsupportedFile.summary'),
        detail: t('toasts.unsupportedFile.detail'),
      });
      return;
    }
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleDelete = async (row: InvestorDocument) => {
    if (row.documentStatus === 'V' || row.documentStatus === 'M') {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('toasts.deleteNotAllowed.summary'),
        detail: t('toasts.deleteNotAllowed.detail'),
      });
      return;
    }
    if (confirm(t('confirm.delete', { name: row.documentName }))) {
      try {
        await deleteMutation.mutateAsync(row.id);
        toastRef.current?.show({
          severity: 'success',
          summary: t('toasts.deleted.summary'),
          detail: t('toasts.deleted.detail'),
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: t('toasts.error.summary'),
          detail: err.response?.data?.message || t('toasts.error.delete'),
        });
      }
    }
  };

  const handleDownload = (row: InvestorDocument) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/${row.documentPath}`.replace(/([^:]\/)\/+/g, '$1');
    window.open(url, '_blank');
  };

  /** ✅ Moved resetForm ABOVE leftToolbarTemplate to avoid temporal dead zone */
  const resetForm = useCallback(() => {
    setFormData({
      documentMasterId: null,
      documentTypeId: null,
      issuerId: null,
      departmentId: null,
      documentName: '',
      documentPath: '',
      validFrom: null,
      validTo: null,
      documentDateOfIssuance: null,
      comments: '',
      file: null,
    });
    setEditingId(null);
    setDateErrors({});
    setCompressionSummary(null);
  }, []);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label={t('actions.add')}
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
      />
    ),
    [t, resetForm],
  );

  const [exporting, setExporting] = useState(false);

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label={t('actions.clearFilters')}
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange('');
            handleFiltersChange({});
          }}
        />
        <Button
          label={t('actions.exportCSV')}
          icon="pi pi-download"
          severity="info"
          rounded
          onClick={async () => {
            setExporting(true);
            await handleExportCSV(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label={t('actions.exportExcel')}
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={async () => {
            setExporting(true);
            await handleExportExcel(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label={t('actions.exportPDF')}
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          onClick={async () => {
            setExporting(true);
            await handleExportPDF(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
      </div>
    ),
    [t, exporting, isLoading, filteredData, clearFilters, handleGlobalFilterChange, handleFiltersChange, handleExportCSV, handleExportExcel, handleExportPDF],
  );

  // Submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate dates first
      const { ok, errors } = validateDates();
      if (!ok) {
        setDateErrors(errors);
        const messages = Object.values(errors).filter(Boolean);
        toastRef.current?.show({
          severity: 'warn',
          summary: t('toasts.invalidDates.summary'),
          detail: messages.join(' '),
        });
        return;
      }

      // Resolve checklistId from selected Document Master
      const selectedMaster = docMasters.find((m: any) => m.id === formData.documentMasterId);
      const checklistId: string | undefined = selectedMaster?.checklistId;

      if (!formData.documentMasterId || !checklistId) {
        toastRef.current?.show({
          severity: 'warn',
          summary: t('toasts.missingChecklist.summary'),
          detail: t('toasts.missingChecklist.detail'),
        });
        return;
      }

      // Upload first (if file selected)
      let finalPath = formData.documentPath;
      let versionFromUpload: string | undefined;
      setCompressionSummary(null);

      if (formData.file) {
        // ✅ Send documentMasterId; backend builds correct name & version
        const uploadRes = (await uploadMutation.mutateAsync({
          file: formData.file,
          documentMasterId: formData.documentMasterId!,
        })) as UploadResponse;

        finalPath = uploadRes.data.filePath;
        versionFromUpload = uploadRes.data.documentVersion;

        // Show compression stats (if present)
        const { originalSizeBytes, compressedSizeBytes, savedPercent } = uploadRes.data;
        if (originalSizeBytes && compressedSizeBytes) {
          setCompressionSummary({
            originalSizeBytes,
            compressedSizeBytes,
            savedPercent,
            mimeType: uploadRes.data.mimetype,
          });
          toastRef.current?.show({
            severity: 'success',
            summary: t('toasts.fileProcessed.summary'),
            detail: t('toasts.fileProcessed.detail', { percent: savedPercent?.toFixed(2) ?? '-' }),
          });
        }
      }

      // Build payload — use local YYYY-MM-DD (avoid toISOString)
      // Use CreateInvestorDocumentDto for create; UpdateInvestorDocumentDto for update
      const commonFields = {
        documentMasterId: formData.documentMasterId!,
        checklistId,
        documentTypeId: formData.documentTypeId!,
        issuerId: formData.issuerId!,
        departmentId: formData.departmentId!,
        documentName: formData.documentName,
        documentPath: finalPath,
        validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
        validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
        documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
        comments: formData.comments || undefined,
      };

      if (editingId) {
        const payloadUpdate: UpdateInvestorDocumentDto = {
          documentName: formData.documentName,
          comments: formData.comments || undefined,
          validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
          validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
          documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
          // Only send documentPath if user uploaded a new file
          documentPath: finalPath && finalPath !== formData.documentPath ? finalPath : undefined,
        };

        await updateMutation.mutateAsync({ id: editingId, data: payloadUpdate });
        toastRef.current?.show({ severity: 'success', summary: t('toasts.success.summary'), detail: t('toasts.success.updated') });
      } else {
        const payloadCreate: CreateInvestorDocumentDto = {
          documentMasterId: formData.documentMasterId!,
          checklistId,
          documentTypeId: formData.documentTypeId!,
          issuerId: formData.issuerId!,
          departmentId: formData.departmentId!,
          documentName: formData.documentName,
          documentPath: finalPath,
          documentVersion: versionFromUpload, // ✅ keep version consistent with filename
          validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
          validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
          documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
          comments: formData.comments || undefined,
        };

        await createMutation.mutateAsync(payloadCreate);
        toastRef.current?.show({ severity: 'success', summary: t('toasts.success.summary'), detail: t('toasts.success.created') });
      }

      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toasts.error.summary'),
        detail: err.response?.data?.message || t('toasts.error.saving'),
      });
    }
  };

  /** Extract filename from documentPath for display */
  const currentFileName = useMemo(() => {
    if (!formData.documentPath) return '';
    const parts = formData.documentPath.split(/[\\/]/);
    return parts[parts.length - 1] || '';
  }, [formData.documentPath]);

  /** Helper for KB/MB display */
  const fmtSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const rowActions: RowAction<InvestorDocument>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: t('actions.edit'), severity: 'info', onClick: (row) => handleEdit(row), tooltip: t('tooltips.edit') },
      { icon: 'pi pi-download', label: t('actions.download'), severity: 'secondary', onClick: (row) => handleDownload(row), tooltip: t('tooltips.downloadFile') },
      {
        icon: 'pi pi-trash',
        label: t('actions.delete'),
        severity: 'error',
        onClick: (row) => handleDelete(row),
        tooltip: t('tooltips.delete'),
        visible: (row) => row.documentStatus !== 'V' && row.documentStatus !== 'M',
      },
    ],
    [t, handleEdit, handleDownload, handleDelete],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      {/* Page Header */}
      <div className="mb-4">
        <h1 className="h2 mb-3">{t('title')}</h1>

        {/* Stats Section */}
        <div className="d-flex flex-wrap gap-2 mb-3 p-2 bg-light rounded">
          <Tag value={t('stats.total', { count: stats?.total ?? 0 })} severity="info" />
          <Tag value={t('stats.unverified', { count: stats?.unverified ?? 0 })} severity="warning" />
          <Tag value={t('stats.verified', { count: stats?.verified ?? 0 })} severity="success" />
          <Tag value={t('stats.rejected', { count: stats?.rejected ?? 0 })} severity="danger" />
          <Tag value={t('stats.mismatched', { count: stats?.mismatch ?? 0 })} severity="secondary" />
        </div>

        {/* Toolbar */}
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3 justify-content-between"
        />
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? t('dialog.editHeader') : t('dialog.addHeader')}
        modal
        style={{ width: '60vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          {/* Section: Document Details */}
          <h5 className="mb-3">{t('sections.details')}</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentType')} *</label>
              <select
                name="documentTypeId"
                value={formData.documentTypeId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'documentTypeId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
              >
                <option value="">{t('common.select')}</option>
                {documentTypes.map((t_) => (
                  <option key={t_.id} value={t_.id}>
                    {t_.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.issuer')} *</label>
              <select
                name="issuerId"
                value={formData.issuerId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'issuerId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
              >
                <option value="">{t('common.select')}</option>
                {issuers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department & Document Master */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.department')} *</label>
              <select
                name="departmentId"
                value={formData.departmentId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'departmentId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
                disabled={!formData.documentTypeId || !formData.issuerId}
              >
                <option value="">{t('common.select')}</option>
                {filteredDepartments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {!formData.documentTypeId || !formData.issuerId ? (
                <small className="text-muted">{t('hints.selectTypeAndIssuer')}</small>
              ) : null}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentMaster')} *</label>
              <select
                name="documentMasterId"
                value={formData.documentMasterId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'documentMasterId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
                disabled={!formData.documentTypeId || !formData.issuerId || !formData.departmentId}
              >
                <option value="">{t('common.select')}</option>
                {filteredDocMasters.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.checklistId} — {m.checklistDocumentName}
                  </option>
                ))}
              </select>
              {!formData.documentTypeId || !formData.issuerId || !formData.departmentId ? (
                <small className="text-muted">{t('hints.selectTypeIssuerDept')}</small>
              ) : null}
            </div>
          </div>

          {/* Section: Upload & Name */}
          <h5 className="mt-4 mb-3">{t('sections.upload')}</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentName')} *</label>
              <InputText
                name="documentName"
                value={formData.documentName}
                onChange={handleInputChange}
                placeholder={t('placeholders.documentName')}
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.selectFile')} *</label>

              {formData.documentPath && (
                <div className="mb-2">
                  <small className="text-muted">
                    {t('hints.currentFile')}&nbsp;
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/${formData.documentPath}`.replace(/([^:]\/)\/+/g, '$1')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {currentFileName}
                    </a>
                  </small>
                </div>
              )}

              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                required={!editingId && !formData.documentPath}
              />

              {formData.file && (
                <small className="text-muted d-block mt-1">
                  {t('hints.selectedFile', {
                    name: formData.file.name,
                    kb: Math.round(formData.file.size / 1024),
                    type: formData.file.type || t('hints.unknownType'),
                  })}
                </small>
              )}

              {/* Compression summary */}
              {compressionSummary && (
                <div className="mt-2">
                  <Tag
                    value={t('hints.compressed', {
                      compressed: fmtSize(compressionSummary.compressedSizeBytes),
                      original: fmtSize(compressionSummary.originalSizeBytes),
                      percent: compressionSummary.savedPercent?.toFixed(2) ?? '-',
                    })}
                    severity="success"
                  />
                </div>
              )}

              <small className="text-muted d-block mt-2">
                {t('hints.allowedTypes')}
              </small>
            </div>
          </div>

          {/* Section: Validity */}
          {isValidityRequired && (
            <>
              <h5 className="mt-4 mb-3">{t('sections.validity')}</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.validFrom')}</label>
                  <Calendar
                    value={formData.validFrom}
                    onChange={(e: any) => handleDateChange('validFrom', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.validFrom ? 'p-invalid' : ''}`}
                    maxDate={formData.validTo ?? undefined}
                  />
                  {dateErrors.validFrom && (
                    <small className="text-danger d-block mt-1">{dateErrors.validFrom}</small>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.validTo')}</label>
                  <Calendar
                    value={formData.validTo}
                    onChange={(e: any) => handleDateChange('validTo', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.validTo ? 'p-invalid' : ''}`}
                    minDate={formData.validFrom ?? undefined}
                  />
                  {dateErrors.validTo && (
                    <small className="text-danger d-block mt-1">{dateErrors.validTo}</small>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.issuedOn')}</label>
                  <Calendar
                    value={formData.documentDateOfIssuance}
                    onChange={(e: any) => handleDateChange('documentDateOfIssuance', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.documentDateOfIssuance ? 'p-invalid' : ''}`}
                    maxDate={formData.validTo ?? undefined}
                  />
                  {dateErrors.documentDateOfIssuance && (
                    <small className="text-danger d-block mt-1">{dateErrors.documentDateOfIssuance}</small>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Comments */}
          <div className="mb-3">
            <label className="form-label">{t('fields.comments')}</label>
            <InputText
              name="comments"
              value={formData.comments ?? ''}
              onChange={handleInputChange}
              className="w-100"
            />
          </div>

          {/* Actions */}
          <div className="d-flex gap-2 mt-3">
            <Button
              label={editingId ? t('actions.update') : t('actions.create')}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
              className="flex-grow-1"
            />
            <Button label={t('actions.cancel')} icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      {/* DataTable */}
      <ReusableDataTable<InvestorDocument>
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
}
