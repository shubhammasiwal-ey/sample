'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

import { useMasterTablesDropdown } from '@/hooks/master/useMasterTables';
import { useFormFieldOptions, useSaveFormFieldOptions } from '@/hooks/master/useFormFieldOptions';

type ParentCandidate = { id: number; field_code: string; label: string; input_type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  builderFieldId: number | null;
  parentCandidates?: ParentCandidate[];
};

type StaticOpt = { label: string; value: string; disabled?: boolean; order?: number };

export function FieldOptionsModal({ open, onClose, builderFieldId, parentCandidates }: Props) {
  const toast = useRef<Toast>(null);

  const { data: existing } = useFormFieldOptions(builderFieldId ?? undefined);
  const save = useSaveFormFieldOptions();
  const { data: masters } = useMasterTablesDropdown();

  // ✅ Stabilize dropdown overlays
  const appendTo = typeof window !== 'undefined' ? document.body : undefined;
  const stableScrollHeight = '300px';

  const parentOptions = useMemo(() => {
    return (parentCandidates ?? [])
      .map((p) => ({
        label: `${p.field_code} — ${p.label}`,
        value: p.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [parentCandidates]);

  const masterOptions = useMemo(() => {
    return (masters ?? []).map((m: any) => ({
      label: `${m.master_name} (${m.master_code})`,
      value: m.id,
    }));
  }, [masters]);

  const [sourceType, setSourceType] = useState<'STATIC' | 'MASTER'>('STATIC');
  const [masterTableId, setMasterTableId] = useState<number | null>(null);
  const [parentBuilderFieldId, setParentBuilderFieldId] = useState<number | null>(null);
  const [staticOptions, setStaticOptions] = useState<StaticOpt[]>([{ label: 'Yes', value: 'Yes' }]);

  useEffect(() => {
    if (!open) return;

    if (existing?.source_type) {
      setSourceType(existing.source_type);
      setMasterTableId(existing.master_table_id ?? null);
      setStaticOptions((existing.static_options ?? []) as StaticOpt[]);
      setParentBuilderFieldId(existing.parent_builder_field_id ?? null);
    } else {
      setSourceType('STATIC');
      setMasterTableId(null);
      setStaticOptions([
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ]);
      setParentBuilderFieldId(null);
    }
  }, [open, existing]);

  function updateOpt(i: number, patch: Partial<StaticOpt>) {
    setStaticOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function addRow() {
    setStaticOptions((prev) => [...prev, { label: '', value: '' }]);
  }

  function removeRow(i: number) {
    setStaticOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveOptions() {
    if (!builderFieldId) return;

    if (sourceType === 'MASTER' && !masterTableId) {
      toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select master table.', life: 2500 });
      return;
    }

    if (sourceType === 'STATIC') {
      const cleaned = staticOptions
        .map((o, idx) => ({ ...o, order: o.order ?? idx + 1 }))
        .filter((o) => o.label.trim() && String(o.value).trim());

      if (cleaned.length === 0) {
        toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Add at least one option.', life: 2500 });
        return;
      }

      await save.mutateAsync({
        builderFieldId,
        sourceType: 'STATIC',
        staticOptions: cleaned,
      });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Options saved.', life: 2000 });
      onClose();
      return;
    }

    // MASTER (✅ include parentBuilderFieldId)
    await save.mutateAsync({
      builderFieldId,
      sourceType: 'MASTER',
      masterTableId: masterTableId!,
      parentBuilderFieldId: parentBuilderFieldId ?? undefined,
    });

    toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Master options linked.', life: 2000 });
    onClose();
  }

  const parentDisabled = sourceType !== 'MASTER' || !parentOptions.length;

  return (
    <Dialog header="Field Options" visible={open} onHide={onClose} style={{ width: 'min(950px, 96vw)' }} modal>
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Source Type</label>
          <Dropdown
            value={sourceType}
            options={[
              { label: 'Static Options', value: 'STATIC' },
              { label: 'Master Table', value: 'MASTER' },
            ]}
            onChange={(e) => {
              const next = e.value as 'STATIC' | 'MASTER';
              setSourceType(next);
              // reset dependent
              if (next === 'STATIC') {
                setMasterTableId(null);
                setParentBuilderFieldId(null);
              }
            }}
            className="w-100"
            appendTo={appendTo}
            scrollHeight={stableScrollHeight}
          />
        </div>

        {sourceType === 'MASTER' ? (
          <div>
            <label style={{ fontWeight: 600 }}>Master Table</label>
            <Dropdown
              value={masterTableId}
              options={masterOptions}
              onChange={(e) => {
                setMasterTableId(e.value);
                // keep parent selection but allow user to change
              }}
              className="w-100"
              placeholder="Select master"
              filter
              filterPlaceholder="Search..."
              showClear
              appendTo={appendTo}
              scrollHeight={stableScrollHeight}
            />
          </div>
        ) : (
          <div />
        )}

        {sourceType === 'MASTER' ? (
          <div>
            <label style={{ fontWeight: 600 }}>Parent Field (for cascading)</label>
            <Dropdown
              value={parentBuilderFieldId}
              options={parentOptions}
              onChange={(e) => setParentBuilderFieldId(e.value ?? null)}
              className="w-100"
              placeholder={parentOptions.length ? '(Optional) Select parent field' : 'No parent fields available'}
              filter
              filterPlaceholder="Search..."
              showClear
              disabled={parentDisabled}
              appendTo={appendTo}
              scrollHeight={stableScrollHeight}
            />
            <small style={{ color: '#6b7280' }}>
              Select a parent field (e.g., Country) so this field (e.g., State) loads only matching options using the
              master table&apos;s <code>parent_column</code>.
            </small>
            {!parentCandidates ? (
              <div className="mt-2">
                <small className="text-danger">
                  Parent fields list not provided by the Builder screen. Please share <code>FormBuilderScreen.tsx</code> if
                  the dropdown remains empty.
                </small>
              </div>
            ) : null}
          </div>
        ) : (
          <div />
        )}
      </div>

      {sourceType === 'STATIC' && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h5 style={{ margin: 0 }}>Static Options</h5>
            <Button label="+ Add Row" size="small" onClick={addRow} />
          </div>

          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staticOptions.map((opt, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <InputText
                  value={opt.label}
                  onChange={(e) => updateOpt(idx, { label: e.target.value })}
                  placeholder="Label"
                />
                <InputText
                  value={String(opt.value ?? '')}
                  onChange={(e) => updateOpt(idx, { value: e.target.value })}
                  placeholder="Value"
                />
                <Button icon="pi pi-times" severity="danger" outlined onClick={() => removeRow(idx)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <Button label="Cancel" severity="secondary" onClick={onClose} />
        <Button label="Save" onClick={saveOptions} loading={save.isPending} />
      </div>
    </Dialog>
  );
}