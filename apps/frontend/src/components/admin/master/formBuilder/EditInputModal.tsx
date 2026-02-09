'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';

import { INPUT_TYPE_OPTIONS } from './constants';
import { useUpdateFormBuilderField } from '@/hooks/master/useFormBuilderFields';

type Props = {
  open: boolean;
  onClose: () => void;
  row: any | null;
  onSaved?: () => void;
};

const PATTERN_OPERATOR_OPTIONS = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '<=', value: '<=' },
  { label: '>=', value: '>=' },
];

export function EditInputModal({ open, onClose, row, onSaved }: Props) {
  const toast = useRef<Toast>(null);
  const update = useUpdateFormBuilderField();

  const [inputType, setInputType] = useState<string>('text');
  const [customLabel, setCustomLabel] = useState('');
  const [helpText, setHelpText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isReadonly, setIsReadonly] = useState(false);
  const [minLength, setMinLength] = useState<number | null>(null);
  const [maxLength, setMaxLength] = useState<number | null>(null);

  const [pattern, setPattern] = useState<string>('');
  const [step, setStep] = useState('');
  const [preference, setPreference] = useState<number | null>(null);

  // ✅ Stabilize dropdown overlays
  const appendTo = typeof window !== 'undefined' ? document.body : undefined;
  const stableScrollHeight = '300px';

  useEffect(() => {
    if (!open || !row) return;

    setInputType(row.input_type ?? 'text');

    // ✅ Use actual stored editable values (do NOT fallback to computed label)
    setCustomLabel(row.custom_label ?? '');
    setHelpText(row.help_text ?? '');

    setIsRequired((row.is_required ?? 'N') === 'Y');
    setIsEditable((row.is_editable ?? 'Y') === 'Y');
    setIsReadonly((row.is_readonly ?? 'N') === 'Y');

    setMinLength(row.min_length ?? null);
    setMaxLength(row.max_length ?? null);

    setPattern(row.pattern ?? '');
    setStep(row.step ?? '');

    setPreference(row.preference ?? null);
  }, [open, row]);

  async function save() {
    if (!row?.id) return;

    try {
      await update.mutateAsync({
        id: row.id,
        data: {
          inputType,
          customLabel: customLabel.trim() || undefined,
          helpText: helpText.trim() || undefined,
          isRequired: isRequired ? 'Y' : 'N',
          isEditable: isEditable ? 'Y' : 'N',
          isReadonly: isReadonly ? 'Y' : 'N',
          minLength: minLength ?? undefined,
          maxLength: maxLength ?? undefined,
          pattern: pattern || undefined,
          step: step.trim() || undefined,
          preference: preference ?? undefined,
        },
      });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Input updated.', life: 2000 });
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Could not update input.',
        life: 3500,
      });
    }
  }

  return (
    <Dialog header="Edit Input" visible={open} onHide={onClose} style={{ width: 'min(900px, 96vw)' }} modal>
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Input Type</label>
          <Dropdown
            value={inputType}
            options={INPUT_TYPE_OPTIONS}
            onChange={(e) => setInputType(e.value)}
            className="w-100"
            filter
            filterDelay={300}
            virtualScrollerOptions={{ itemSize: 38 }}
            scrollHeight={stableScrollHeight}
            appendTo={appendTo}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Order</label>
          <InputNumber value={preference} onValueChange={(e) => setPreference(e.value ?? null)} className="w-100" />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Custom Label</label>
          <InputText value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="w-100" />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Help Text</label>
          <InputText value={helpText} onChange={(e) => setHelpText(e.target.value)} className="w-100" />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <Checkbox checked={isRequired} onChange={(e) => setIsRequired(!!e.checked)} />
            <span style={{ marginLeft: 8 }}>Required</span>
          </div>
          <div>
            <Checkbox checked={isEditable} onChange={(e) => setIsEditable(!!e.checked)} />
            <span style={{ marginLeft: 8 }}>Editable</span>
          </div>
          <div>
            <Checkbox checked={isReadonly} onChange={(e) => setIsReadonly(!!e.checked)} />
            <span style={{ marginLeft: 8 }}>Readonly</span>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Min Length</label>
          <InputNumber value={minLength} onValueChange={(e) => setMinLength(e.value ?? null)} className="w-100" />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Max Length</label>
          <InputNumber value={maxLength} onValueChange={(e) => setMaxLength(e.value ?? null)} className="w-100" />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Pattern Operator</label>
          <Dropdown
            value={pattern || null}
            options={PATTERN_OPERATOR_OPTIONS}
            onChange={(e) => setPattern(e.value ?? '')}
            placeholder="Select operator"
            className="w-100"
            showClear
            scrollHeight={stableScrollHeight}
            appendTo={appendTo}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Step (for number)</label>
          <InputText value={step} onChange={(e) => setStep(e.target.value)} className="w-100" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <Button label="Cancel" severity="secondary" onClick={onClose} />
        <Button label="Save" onClick={save} loading={update.isPending} />
      </div>
    </Dialog>
  );
}