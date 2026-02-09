'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { useFormAddMoreGroups, useCreateFormAddMoreGroup, useSetFormAddMoreColumns } from '@/hooks/master/useFormAddMore';
import { useFormBuilderFields } from '@/hooks/master/useFormBuilderFields';

type Props = {
  open: boolean;
  onClose: () => void;

  serviceId: string;
  formTypeId: number;
  pageId: number;
  categoryId: number;

  triggerBuilderFieldId: number | null; // the addmore field row
};

export function AddMoreModal({
  open,
  onClose,
  serviceId,
  formTypeId,
  pageId,
  categoryId,
  triggerBuilderFieldId,
}: Props) {
  const toast = useRef<Toast>(null);

  const { data: builderRows = [] } = useFormBuilderFields({
    serviceId,
    formTypeId,
    pageId,
    categoryId,
  });

  const { data: groups = [] } = useFormAddMoreGroups(
    triggerBuilderFieldId
      ? { serviceId, formTypeId, pageId, categoryId, triggerBuilderFieldId }
      : undefined,
  );

  const createGroup = useCreateFormAddMoreGroup();
  const setCols = useSetFormAddMoreColumns();

  const [groupId, setGroupId] = useState<number | null>(null);
  const [minRows, setMinRows] = useState<number>(1);
  const [maxRows, setMaxRows] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);

  const columnOptions = useMemo(() => {
    // allow any existing fields as columns EXCEPT the trigger addmore field itself
    return (builderRows ?? [])
      .filter((r: any) => r.id !== triggerBuilderFieldId)
      .map((r: any) => ({
        label: `${r.label} (${r.field_code})`,
        value: r.id,
      }));
  }, [builderRows, triggerBuilderFieldId]);

  useEffect(() => {
    if (!open) return;
    // if group exists, select it
    const first = groups?.[0];
    if (first) {
      setGroupId(first.id);
      setMinRows(first.min_rows ?? 1);
      setMaxRows(first.max_rows ?? null);
      setSelectedColumns((first.columns ?? []).map((c: any) => c.builder_field_id));
    } else {
      setGroupId(null);
      setMinRows(1);
      setMaxRows(null);
      setSelectedColumns([]);
    }
  }, [open, groups]);

  async function ensureGroup(): Promise<number> {
    if (!triggerBuilderFieldId) throw new Error('Missing trigger field.');
    if (groupId) return groupId;

    const created = await createGroup.mutateAsync({
      serviceId,
      formTypeId,
      pageId,
      categoryId,
      triggerBuilderFieldId,
      label: 'Add More',
      minRows,
      maxRows,
    });

    return created.id;
  }

  async function save() {
    try {
      if (!triggerBuilderFieldId) return;

      if (!selectedColumns.length) {
        toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select at least one column.', life: 2500 });
        return;
      }

      const gid = await ensureGroup();
      await setCols.mutateAsync({ groupId: gid, columnBuilderFieldIds: selectedColumns });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'AddMore config saved.', life: 2000 });
      onClose();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? e?.message ?? 'Failed to save AddMore config.',
        life: 3500,
      });
    }
  }

  return (
    <Dialog header="Add More Configuration" visible={open} onHide={onClose} style={{ width: 'min(900px, 96vw)' }} modal>
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Min Rows</label>
          <InputNumber value={minRows} onValueChange={(e) => setMinRows(e.value ?? 1)} className="w-100" min={1} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Max Rows (optional)</label>
          <InputNumber value={maxRows} onValueChange={(e) => setMaxRows(e.value ?? null)} className="w-100" min={1} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontWeight: 600 }}>Columns (fields to repeat)</label>
          <MultiSelect
            value={selectedColumns}
            options={columnOptions}
            onChange={(e) => setSelectedColumns(e.value)}
            className="w-100"
            placeholder="Select columns"
            filter
            display="chip"
          />
          <small style={{ color: '#666' }}>
            These selected fields will appear as row columns for the Add More table.
          </small>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <Button label="Cancel" severity="secondary" onClick={onClose} />
        <Button label="Save" onClick={save} loading={createGroup.isPending || setCols.isPending} />
      </div>
    </Dialog>
  );
}