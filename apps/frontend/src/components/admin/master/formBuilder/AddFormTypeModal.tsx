'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

import apiClient from '@/lib/api-client';
import { useFormTypes } from '@/hooks/master/useFormTypes';
import { STATE_PREFIX } from '@/constants/formCode';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;

  // allow async handler from parent (you pass async in FormBuilderMaster)
  onSuccess: () => void | Promise<void>;

  // Validation: prevent duplicate form type in same service
  existingFormTypeIds?: number[];

  // Validation: prevent duplicate generated form codes in same service
  existingFormCodes?: string[];
};

export function AddFormTypeModal({
  open,
  onClose,
  serviceId,
  onSuccess,
  existingFormTypeIds = [],
  existingFormCodes = [],
}: Props) {
  const toast = useRef<Toast>(null);

  const { data: formTypes } = useFormTypes();

  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(''); // read-only value from server
  const [formVersion, setFormVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const options = useMemo(() => {
    return (formTypes ?? []).map((t: any) => ({
      label: `${t.name} (${t.id})`,
      value: t.id,
    }));
  }, [formTypes]);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setFormTypeId(null);
    setFormName('');
    setFormVersion('');
    setFormCode('');
    setLoadingCode(false);
  }, [open]);

  // Fetch preview code when formTypeId changes
  useEffect(() => {
    if (!open) return;

    if (!formTypeId) {
      setFormCode('');
      return;
    }

    // Prevent duplicate form type early
    if (existingFormTypeIds.includes(formTypeId)) {
      setFormTypeId(null);
      setFormCode('');
      toast.current?.show({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This Form Type is already mapped to this Service.',
        life: 3000,
      });
      return;
    }

    const fetchCode = async () => {
      setLoadingCode(true);
      try {
        const res = await apiClient.get(
          `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/preview-code`,
          { params: { formTypeId } }
        );

        const nextCode = res?.data?.formCode ?? '';

        // Prevent duplicate form code (if backend returns something already used)
        if (nextCode && existingFormCodes.includes(nextCode)) {
          setFormCode('');
          toast.current?.show({
            severity: 'warn',
            summary: 'Duplicate Code',
            detail: 'Generated Form Code already exists for this Service.',
            life: 3500,
          });
          return;
        }

        setFormCode(nextCode);
      } catch (e: any) {
        setFormCode('');
        toast.current?.show({
          severity: 'error',
          summary: 'Failed',
          detail: e?.response?.data?.message ?? 'Could not generate Form Code.',
          life: 3500,
        });
      } finally {
        setLoadingCode(false);
      }
    };

    fetchCode();
  }, [open, formTypeId, serviceId, existingFormTypeIds, existingFormCodes]);

  async function save() {
    if (!formTypeId || !formName.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Please fill Form Type and Form Name.',
        life: 3000,
      });
      return;
    }

    if (existingFormTypeIds.includes(formTypeId)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This Form Type is already mapped to this Service.',
        life: 3000,
      });
      return;
    }

    if (!formCode.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Form Code not ready',
        detail: 'Form Code could not be generated. Please try again.',
        life: 3000,
      });
      return;
    }

    // Extra safety: prevent duplicates by code too
    if (existingFormCodes.includes(formCode.trim())) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Duplicate Code',
        detail: 'This Form Code already exists for this Service.',
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(
        `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms`,
        {
          formTypeId,
          formName,
          formCode,
          formVersion: formVersion?.trim() ? formVersion.trim() : undefined,
        }
      );

      toast.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: 'Form type added successfully.',
        life: 2500,
      });

      // supports both sync and async onSuccess
      await Promise.resolve(onSuccess());

      onClose();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Could not add form type.',
        life: 3500,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      header="Add Form Type"
      visible={open}
      onHide={onClose}
      style={{ width: 'min(720px, 95vw)' }}
      modal
    >
      <Toast ref={toast} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Form Type</label>
          <Dropdown
            value={formTypeId}
            options={options}
            onChange={(e) => setFormTypeId(e.value)}
            placeholder="Select Form Type"
            className="w-100"
            filter
            showClear
            disabled={saving}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Form Name</label>
          <InputText
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-100"
            disabled={saving}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Form Code</label>
          <InputText
            value={loadingCode ? 'Generating...' : formCode}
            className="w-100"
            readOnly
            disabled
          />
          <small style={{ color: '#666' }}>
            Auto-generated pattern: {STATE_PREFIX}-SR-{serviceId}-FRM-&lt;PK&gt;_&lt;FormTypeId(2-digit)&gt;
          </small>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Form Version (optional)</label>
          <InputText
            value={formVersion}
            onChange={(e) => setFormVersion(e.target.value)}
            className="w-100"
            placeholder="e.g. V1.0"
            disabled={saving}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button
            label="Cancel"
            severity="secondary"
            onClick={onClose}
            disabled={saving}
          />
          <Button
            label="Save"
            onClick={save}
            loading={saving}
            disabled={saving || loadingCode || !formTypeId}
          />
        </div>
      </div>
    </Dialog>
  );
}
