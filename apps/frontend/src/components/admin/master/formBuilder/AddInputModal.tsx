'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';

import { useFormFields } from '@/hooks/master/useFormFields';
import { INPUT_TYPE_OPTIONS, OPTION_CAPABLE_TYPES } from './constants';
import { useCreateFormBuilderField } from '@/hooks/master/useFormBuilderFields';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  formTypeId: number;
  pageId: number;
  categoryId: number;
  existingFormFieldIds?: number[];
  onCreated?: () => void;
};

const PATTERN_OPERATOR_OPTIONS = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '<=', value: '<=' },
  { label: '>=', value: '>=' },
];

export function AddInputModal({
  open,
  onClose,
  serviceId,
  formTypeId,
  pageId,
  categoryId,
  existingFormFieldIds = [],
  onCreated,
}: Props) {
  const toast = useRef<Toast>(null);
  const { data: fields } = useFormFields();
  const create = useCreateFormBuilderField();

  const fieldOptions = useMemo(() => {
    return (fields ?? []).map((f: any) => ({
      label: `${f.name} (${f.formCheckId ?? f.formchk_id ?? f.id})`,
      value: f.id,
      disabled: existingFormFieldIds.includes(f.id),
    }));
  }, [fields, existingFormFieldIds]);

  const [formFieldId, setFormFieldId] = useState<number | null>(null);
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

  // ✅ Stabilize dropdown overlays (prevents shrinking with virtual scroll)
  const appendTo = typeof window !== 'undefined' ? document.body : undefined;
  const stableScrollHeight = '300px';

  useEffect(() => {
    if (!open) return;
    setFormFieldId(null);
    setInputType('text');
    setCustomLabel('');
    setHelpText('');
    setIsRequired(false);
    setIsEditable(true);
    setIsReadonly(false);
    setMinLength(null);
    setMaxLength(null);
    setPattern('');
    setStep('');
  }, [open]);

  async function save() {
    if (!formFieldId) {
      toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select a Field.', life: 2500 });
      return;
    }

    try {
      await create.mutateAsync({
        pageId,
        categoryId,
        serviceId,
        formTypeId,
        formFieldId,
        inputType,
        isRequired: isRequired ? 'Y' : 'N',
        isEditable: isEditable ? 'Y' : 'N',
        isReadonly: isReadonly ? 'Y' : 'N',
        minLength: minLength ?? undefined,
        maxLength: maxLength ?? undefined,
        customLabel: customLabel.trim() || undefined,
        helpText: helpText.trim() || undefined,
        pattern: pattern || undefined,
        step: step.trim() || undefined,
      });

      toast.current?.show({ severity: 'success', summary: 'Added', detail: 'Input added.', life: 2000 });
      onCreated?.();
      onClose();

      if (OPTION_CAPABLE_TYPES.includes(inputType as any)) {
        // intentionally empty
      }
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Could not add input.',
        life: 3500,
      });
    }
  }

  return (
    <Dialog header="Add Input" visible={open} onHide={onClose} style={{ width: 'min(900px, 96vw)' }} modal>
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Field</label>
          <Dropdown
            value={formFieldId}
            options={fieldOptions}
            onChange={(e) => setFormFieldId(e.value)}
            placeholder="Select Field"
            className="w-100"
            filter
            filterDelay={300}
            showClear
            virtualScrollerOptions={{ itemSize: 38 }}
            scrollHeight={stableScrollHeight}
            appendTo={appendTo}
          />
          <small style={{ color: '#666' }}>Disabled options are already added in this category.</small>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Input Type</label>
          <Dropdown
            value={inputType}
            options={INPUT_TYPE_OPTIONS}
            onChange={(e) => setInputType(e.value)}
            placeholder="Select Input Type"
            className="w-100"
            filter
            filterDelay={300}
            showClear={false}
            virtualScrollerOptions={{ itemSize: 38 }}
            scrollHeight={stableScrollHeight}
            appendTo={appendTo}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Custom Label (optional)</label>
          <InputText value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="w-100" />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Help Text (optional)</label>
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
        <Button label="Save" onClick={save} loading={create.isPending} />
      </div>
    </Dialog>
  );
}
