'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

import type { FbPage, FbPageCategory } from '@/types/formBuilder';
import apiClient from '@/lib/api-client';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import type { DataTableColumnConfig } from '@/components/DataTable/types';

import { useFormBuilderFields, useDeleteFormBuilderField } from '@/hooks/master/useFormBuilderFields';
import { useFormCategories } from '@/hooks/master/useFormCategories';

import { AddInputModal } from './AddInputModal';
import { FieldOptionsModal } from './FieldOptionsModal';
import { AddMoreModal } from './AddMoreModal';
import { EditInputModal } from './EditInputModal';
import { OPTION_CAPABLE_TYPES } from './constants';

type Props = { serviceId: string; formTypeId: number };

type ParentCandidate = { id: number; field_code: string; label: string; input_type: string };

export function FormBuilderScreen({ serviceId, formTypeId }: Props) {
  const toast = useRef<Toast>(null);

  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  const [builderMeta, setBuilderMeta] = useState<{
    serviceId: string;
    serviceName: string;
    formTypeId: number;
    formTypeName: string;
  } | null>(null);

  const [pages, setPages] = useState<FbPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  const [pageCategories, setPageCategories] = useState<FbPageCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsFieldId, setOptionsFieldId] = useState<number | null>(null);

  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [addMoreTriggerId, setAddMoreTriggerId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);

  const del = useDeleteFormBuilderField();

  const { data: categoryMaster = [] } = useFormCategories();
  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    (categoryMaster ?? []).forEach((c: any) => map.set(c.id, c.categoryName ?? c.nameAlt ?? `Category-${c.id}`));
    return map;
  }, [categoryMaster]);

  const loadPages = useCallback(async () => {
    const res = await apiClient.get(
      `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/${formTypeId}/pages`,
    );
    setPages(res.data ?? []);
  }, [serviceId, formTypeId]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/${formTypeId}/meta`,
      );
      setBuilderMeta(res.data ?? null);
    } catch {
      setBuilderMeta(null);
    }
  }, [serviceId, formTypeId]);

  const loadPageCategories = useCallback(async (pageId: number) => {
    const res = await apiClient.get(`/master/form-builder/pages/${pageId}/categories`);
    setPageCategories(res.data ?? []);
  }, []);

  useEffect(() => {
    loadMeta().catch(() => {});
    loadPages().catch(() => {});
    setSelectedPageId(null);
    setSelectedCategoryId(null);
    setPageCategories([]);
  }, [loadMeta, loadPages]);

  useEffect(() => {
    if (!selectedPageId) return;
    setSelectedCategoryId(null);
    loadPageCategories(selectedPageId).catch(() => setPageCategories([]));
  }, [selectedPageId, loadPageCategories]);

  const pageOptions = useMemo(
    () =>
      (pages ?? []).map((p) => ({
        label: `Page ${p.preference} — ${p.page_name ?? ''}`,
        value: p.id,
      })),
    [pages],
  );

  const categoryOptions = useMemo(
    () =>
      (pageCategories ?? []).map((c) => ({
        label: `${categoryNameById.get(c.category_id) ?? `Category ${c.category_id}`}`,
        value: c.category_id,
      })),
    [pageCategories, categoryNameById],
  );

  const { data: builderRows = [], isLoading, refetch } = useFormBuilderFields({
    serviceId,
    formTypeId,
    pageId: selectedPageId,
    categoryId: selectedCategoryId,
  });

  const existingFormFieldIds = useMemo(
    () => (builderRows ?? []).map((r: any) => r.form_field_id).filter(Boolean),
    [builderRows],
  );

  /**
   * ✅ Parent candidates for cascading dropdown configuration:
   * - same page/category (builderRows already scoped)
   * - exclude current field (optionsFieldId)
   * - exclude `addmore` fields (not scalar)
   */
  const parentCandidates: ParentCandidate[] = useMemo(() => {
    if (!Array.isArray(builderRows) || builderRows.length === 0) return [];
    return builderRows
      .filter((r: any) => r && r.id !== optionsFieldId)
      .filter((r: any) => r?.input_type !== 'addmore')
      .map((r: any) => ({
        id: r.id,
        field_code: r.field_code,
        label: r.label,
        input_type: r.input_type,
      }));
  }, [builderRows, optionsFieldId]);

  const doDelete = useCallback(
    async (id: number) => {
      const ok = window.confirm('Delete this input?');
      if (!ok) return;

      try {
        await del.mutateAsync(id);
        toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Input deleted.', life: 2000 });
        await refetch();
      } catch (e: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Failed',
          detail: e?.response?.data?.message ?? 'Could not delete.',
          life: 3500,
        });
      }
    },
    [del, refetch],
  );

  const columns: DataTableColumnConfig<any>[] = useMemo(
    () => [
      { field: 'preference', header: 'Order', filterType: 'none' },
      { field: 'field_code', header: 'Field Code', filterType: 'text' },
      { field: 'label', header: 'Label', filterType: 'text' },
      { field: 'input_type', header: 'Input Type', filterType: 'text' },
      { field: 'is_required', header: 'Required', filterType: 'none' },
      {
        field: 'actions',
        header: 'Actions',
        filterType: 'none',
        body: (row: any) => {
          const canOptions = OPTION_CAPABLE_TYPES.includes(row.input_type);
          const isAddMore = row.input_type === 'addmore';

          return (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                size="small"
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                onClick={() => {
                  setEditRow(row);
                  setEditOpen(true);
                }}
              />

              {canOptions && (
                <Button
                  size="small"
                  label="Add Option"
                  icon="pi pi-list"
                  severity="secondary"
                  onClick={() => {
                    setOptionsFieldId(row.id);
                    setOptionsOpen(true);
                  }}
                />
              )}

              {isAddMore && (
                <Button
                  size="small"
                  label="Add More"
                  icon="pi pi-table"
                  severity="secondary"
                  onClick={() => {
                    setAddMoreTriggerId(row.id);
                    setAddMoreOpen(true);
                  }}
                />
              )}

              <Button
                size="small"
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                onClick={() => doDelete(row.id)}
              />
            </div>
          );
        },
      },
    ],
    [doDelete],
  );

  // ✅ Fix dropdown overlay shrinking (overlay + virtual scroller)
  const appendTo = useMemo(() => (typeof window !== 'undefined' ? document.body : undefined), []);

  return (
    <div>
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Select Page</label>
          <Dropdown
            value={selectedPageId}
            options={pageOptions}
            onChange={(e) => setSelectedPageId(e.value)}
            placeholder="Select Page"
            className="w-100"
            filter
            filterDelay={300}
            showClear
            virtualScrollerOptions={{ itemSize: 36 }}
            scrollHeight="300px"
            appendTo={appendTo}
            panelStyle={{ minWidth: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Select Category</label>
          <Dropdown
            value={selectedCategoryId}
            options={categoryOptions}
            onChange={(e) => setSelectedCategoryId(e.value)}
            placeholder="Select Category"
            className="w-100"
            filter
            filterDelay={300}
            showClear
            disabled={!selectedPageId}
            virtualScrollerOptions={{ itemSize: 36 }}
            scrollHeight="300px"
            appendTo={appendTo}
            panelStyle={{ minWidth: '100%' }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          Form Builder — Service: {builderMeta?.serviceId ?? serviceId}{' '}
          {builderMeta?.serviceName ? `(${builderMeta.serviceName})` : ''} | Form Type:{' '}
          {builderMeta?.formTypeId ?? formTypeId}{' '}
          {builderMeta?.formTypeName ? `(${builderMeta.formTypeName})` : ''}
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            label="Generate Form"
            icon="pi pi-eye"
            severity="info"
            onClick={() =>
              router.push(`/${locale}/admin/master/form-builder/services/${serviceId}/forms/${formTypeId}/builder/preview`)
            }
          />
        </div>
      </div>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Added Pages, Categories & Inputs</h4>
        <Button
          label="+ Add Input"
          icon="pi pi-plus"
          disabled={!selectedPageId || !selectedCategoryId}
          onClick={() => setAddOpen(true)}
        />
      </div>

      <ReusableDataTable
        data={builderRows}
        loading={isLoading}
        config={{
          dataKey: 'id',
          columns,
          globalFilterFields: ['field_code', 'label', 'input_type'],
          rows: 10,
          rowsPerPageOptions: [10, 25, 50],
          stripedRows: true,
          showGridlines: true,
        }}
      />

      {selectedPageId && selectedCategoryId && (
        <AddInputModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          serviceId={serviceId}
          formTypeId={formTypeId}
          pageId={selectedPageId}
          categoryId={selectedCategoryId}
          existingFormFieldIds={existingFormFieldIds}
          onCreated={() => refetch()}
        />
      )}

      <EditInputModal
        open={editOpen}
        row={editRow}
        onClose={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
        onSaved={async () => {
          toast.current?.show({ severity: 'success', summary: 'Updated', detail: 'Input updated.', life: 2000 });
          await refetch();
        }}
      />

      <FieldOptionsModal
        open={optionsOpen}
        onClose={() => {
          setOptionsOpen(false);
          // keep optionsFieldId so modal can reopen quickly; clear if you prefer:
          // setOptionsFieldId(null);
        }}
        builderFieldId={optionsFieldId}
        parentCandidates={parentCandidates}
      />

      {selectedPageId && selectedCategoryId && (
        <AddMoreModal
          open={addMoreOpen}
          onClose={() => setAddMoreOpen(false)}
          serviceId={serviceId}
          formTypeId={formTypeId}
          pageId={selectedPageId}
          categoryId={selectedCategoryId}
          triggerBuilderFieldId={addMoreTriggerId}
        />
      )}
    </div>
  );
}