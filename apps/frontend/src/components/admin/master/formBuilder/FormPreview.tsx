'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';

import apiClient from '@/lib/api-client';
import {
  PreviewAddMoreGroup,
  PreviewAddMoreColumn,
  PreviewField,
  PreviewOption,
  PreviewRule,
  YnFlag,
  useFormBuilderPreview,
} from '@/hooks/master/useFormBuilderPreview';

type Props = {
  serviceId: string;
  formTypeId: number;
};

type Errors = Record<string, string>;

type AddMoreValues = Record<number, Array<Record<string, any>>>;

type FieldOverrides = {
  required?: boolean;
  visible?: boolean;
  readonly?: boolean;
  editable?: boolean;
};

function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function normalizeOptions(options: PreviewOption[] | null | undefined): PreviewOption[] {
  if (!options) return [];
  const sorted = [...options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.map((o) => ({ label: o.label, value: o.value, disabled: o.disabled, order: o.order }));
}

function fieldDisabled(isEditable: YnFlag, isReadonly: YnFlag, override?: FieldOverrides) {
  const base = isEditable === 'N' || isReadonly === 'Y';
  if (override?.readonly === true) return true;
  if (override?.editable === false) return true;
  return base;
}

function toArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined) return [];
  return [v];
}

function normalizeThenActions(
  thenJson: any,
  resolveFieldCode: (ref: any) => string | null,
): Array<{ field: string; prop: keyof FieldOverrides; value: boolean }> {
  const actions: Array<{ field: string; prop: keyof FieldOverrides; value: boolean }> = [];

  if (!thenJson || typeof thenJson !== 'object') return actions;

  const pushSet = (fieldRef: any, set: any) => {
    const code = resolveFieldCode(fieldRef);
    if (!code || !set || typeof set !== 'object') return;
    for (const [k, v] of Object.entries(set)) {
      if (['required', 'visible', 'readonly', 'editable'].includes(k) && typeof v === 'boolean') {
        actions.push({ field: code, prop: k as keyof FieldOverrides, value: v });
      }
    }
  };

  // Style 1: { actions: [{ field|targetField, set: { required/visible/readonly/editable } }] }
  if (Array.isArray(thenJson.actions)) {
    for (const a of thenJson.actions) {
      pushSet(a?.field ?? a?.targetField ?? a?.builderFieldId ?? a?.targetBuilderFieldId, a?.set);
    }
  }

  // Style 2: { set: { FIELD_CODE|BUILDER_ID: { required: true, visible: false } } }
  if (thenJson.set && typeof thenJson.set === 'object') {
    for (const [field, patch] of Object.entries(thenJson.set)) {
      pushSet(field, patch);
    }
  }

  // Style 3: { required: ['A'], optional: ['B'], show: ['A'], hide: ['B'], readonly: ['C'], editable: ['D'] }
  if (Array.isArray(thenJson.required)) {
    for (const f of thenJson.required) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'required', value: true });
    }
  }
  if (Array.isArray(thenJson.optional)) {
    for (const f of thenJson.optional) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'required', value: false });
    }
  }
  if (Array.isArray(thenJson.show)) {
    for (const f of thenJson.show) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'visible', value: true });
    }
  }
  if (Array.isArray(thenJson.hide)) {
    for (const f of thenJson.hide) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'visible', value: false });
    }
  }
  if (Array.isArray(thenJson.readonly)) {
    for (const f of thenJson.readonly) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'readonly', value: true });
    }
  }
  if (Array.isArray(thenJson.editable)) {
    for (const f of thenJson.editable) {
      const code = resolveFieldCode(f);
      if (code) actions.push({ field: code, prop: 'readonly', value: false });
    }
  }

  return actions;
}

function evalConditionTree(
  tree: any,
  values: Record<string, any>,
  resolveFieldCode: (ref: any) => string | null,
): boolean {
  if (!tree || typeof tree !== 'object') return false;

  // { all: [cond...] }
  if (Array.isArray(tree.all)) {
    return tree.all.every((c: any) => evalConditionTree(c, values, resolveFieldCode));
  }

  // { any: [cond...] }
  if (Array.isArray(tree.any)) {
    return tree.any.some((c: any) => evalConditionTree(c, values, resolveFieldCode));
  }

  // leaf: { field, operator, value }
  const fieldRef = tree.field ?? tree.field_code ?? tree.left ?? tree.builderFieldId ?? tree.fieldId;
  const op = (tree.operator ?? tree.op ?? 'equals') as string;
  const rhs = tree.value ?? tree.right;

  const fieldCode = resolveFieldCode(fieldRef);
  if (!fieldCode) return false;

  const lhs = values[fieldCode];

  switch (op) {
    case 'equals':
    case 'eq':
      return lhs === rhs;
    case 'not_equals':
    case 'neq':
      return lhs !== rhs;
    case 'in': {
      const rhsArr = Array.isArray(rhs) ? rhs : [rhs];
      const lhsArr = toArray(lhs);
      return lhsArr.some((x) => rhsArr.includes(x));
    }
    case 'not_in': {
      const rhsArr = Array.isArray(rhs) ? rhs : [rhs];
      const lhsArr = toArray(lhs);
      return lhsArr.every((x) => !rhsArr.includes(x));
    }
    case 'contains': {
      if (typeof lhs === 'string' && typeof rhs === 'string') return lhs.includes(rhs);
      const lhsArr = toArray(lhs);
      return lhsArr.includes(rhs);
    }
    case 'greater_than':
      return Number(lhs) > Number(rhs);
    case 'less_than':
      return Number(lhs) < Number(rhs);
    case 'is_empty':
      return isEmptyValue(lhs);
    case 'is_not_empty':
      return !isEmptyValue(lhs);
    default:
      return false;
  }
}

export function FormPreview({ serviceId, formTypeId }: Props) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  const { data, isLoading, isError, error, refetch } = useFormBuilderPreview(serviceId, formTypeId);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [addMoreValues, setAddMoreValues] = useState<AddMoreValues>({});

  const optionsCacheRef = useRef<Record<string, PreviewOption[]>>({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const prevValuesRef = useRef<Record<string, any>>({});

  const appendTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return document.body;
  }, []);

  const pages = data?.pages ?? [];
  const meta = data?.meta;
  const rules = (data as any)?.rules as PreviewRule[] | undefined;

  const activePage = pages[activePageIndex];

  const fieldIdToCode = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          map.set(f.id, f.field_code);
        }
      }
    }
    return map;
  }, [pages]);

  const resolveFieldCode = useCallback(
    (ref: any): string | null => {
      if (ref === null || ref === undefined) return null;
      // numeric builder field id
      if (typeof ref === 'number') return fieldIdToCode.get(ref) ?? null;
      const s = String(ref).trim();
      if (!s) return null;
      // numeric string
      if (/^\d+$/.test(s)) return fieldIdToCode.get(Number(s)) ?? null;
      // otherwise treat as field_code
      return s;
    },
    [fieldIdToCode],
  );

  const cascadingConfigs = useMemo(() => {
    const list: Array<{ childCode: string; parentCode: string; masterId: number }> = [];
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          const oc: any = (f as any).option_config;
          if (oc?.source_type === 'MASTER' && oc?.master_table_id && oc?.parent_builder_field_id) {
            const parentCode = fieldIdToCode.get(Number(oc.parent_builder_field_id));
            if (parentCode) {
              list.push({ childCode: f.field_code, parentCode, masterId: Number(oc.master_table_id) });
            }
          }
        }
      }
    }
    return list;
  }, [pages, fieldIdToCode]);

  const computedOverrides = useMemo<Record<string, FieldOverrides>>(() => {
    const out: Record<string, FieldOverrides> = {};
    const activeRules = (rules ?? []).filter((r) => r?.is_active === 'Y');

    for (const r of activeRules) {
      try {
        if (!evalConditionTree(r.when_json, values, resolveFieldCode)) continue;
        const actions = normalizeThenActions(r.then_json, resolveFieldCode);
        for (const a of actions) {
          if (!out[a.field]) out[a.field] = {};
          out[a.field][a.prop] = a.value;
        }
      } catch {
        // ignore broken rules
      }
    }

    return out;
  }, [rules, values, resolveFieldCode]);

  // Initialize AddMore min rows
  useEffect(() => {
    if (!data) return;

    setErrors({});

    // addmore init
    const groups: PreviewAddMoreGroup[] = [];
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          if (f.input_type === 'addmore' && Array.isArray(f.add_more_groups)) {
            for (const g of f.add_more_groups) groups.push(g);
          }
        }
      }
    }

    setAddMoreValues((prev) => {
      const next: AddMoreValues = { ...prev };
      for (const g of groups) {
        const existing = next[g.id] ?? [];
        const minRows = Math.max(1, Number(g.min_rows ?? 1));
        if (existing.length >= minRows) continue;
        next[g.id] = [...existing, ...Array.from({ length: minRows - existing.length }).map(() => ({}))];
      }
      return next;
    });
  }, [data, pages]);

  // Cascading: clear child when parent changes
  useEffect(() => {
    if (!cascadingConfigs.length) return;

    const prev = prevValuesRef.current;

    for (const cfg of cascadingConfigs) {
      const prevParent = prev[cfg.parentCode];
      const currParent = values[cfg.parentCode];
      const prevKey = JSON.stringify(prevParent ?? null);
      const currKey = JSON.stringify(currParent ?? null);

      if (prevKey !== currKey) {
        setValues((p) => {
          if (!(cfg.childCode in p)) return p;
          const copy = { ...p };
          delete copy[cfg.childCode];
          return copy;
        });

        setErrors((p) => {
          const copy = { ...p };
          delete copy[cfg.childCode];
          return copy;
        });
      }
    }

    prevValuesRef.current = values;
  }, [cascadingConfigs, values]);

  // Cascading: fetch options for children when parent value is available
  useEffect(() => {
    if (!cascadingConfigs.length) return;

    const fetchOne = async (masterId: number, parentVal: any) => {
      const pvKey = JSON.stringify(parentVal ?? null);
      const cacheKey = `master:${masterId}:parent:${pvKey}`;
      if (optionsCacheRef.current[cacheKey]) return;
      if (inFlightRef.current.has(cacheKey)) return;

      inFlightRef.current.add(cacheKey);
      try {
        const parentValueParam = Array.isArray(parentVal) ? parentVal.join(',') : String(parentVal);
        const { data: opts } = await apiClient.get<PreviewOption[]>(
          `/master/form-builder/master-tables/${masterId}/options`,
          {
            params: {
              parentValue: parentValueParam,
              includeInactive: 1, // avoid incomplete lists for COUNTRY/STATE
              take: 20000,
            },
          },
        );
        optionsCacheRef.current[cacheKey] = opts ?? [];
      } catch {
        optionsCacheRef.current[cacheKey] = [];
      } finally {
        inFlightRef.current.delete(cacheKey);
      }
    };

    for (const cfg of cascadingConfigs) {
      const parentVal = values[cfg.parentCode];
      if (isEmptyValue(parentVal)) continue;
      fetchOne(cfg.masterId, parentVal);
    }
  }, [cascadingConfigs, values]);

  const headerTitle = useMemo(() => {
    if (!meta) return 'Generate Form — Preview';
    const svc = `${meta.serviceId}${meta.serviceName ? ` (${meta.serviceName})` : ''}`;
    const ft = `${meta.formTypeId}${meta.formTypeName ? ` (${meta.formTypeName})` : ''}`;
    return `Generate Form — Preview • Service: ${svc} • Form Type: ${ft}`;
  }, [meta]);

  const resetAll = useCallback(() => {
    setValues({});
    setErrors({});
    setAddMoreValues({});
    optionsCacheRef.current = {};
    inFlightRef.current = new Set();
    prevValuesRef.current = {};
  }, []);

  const validateField = useCallback((field: PreviewField, value: any, override?: FieldOverrides) => {
    const key = field.field_code;
    const required = override?.required ?? field.is_required === 'Y';

    if (required && isEmptyValue(value)) {
      return `${field.label || key} is required`;
    }

    if (typeof value === 'string') {
      const len = value.trim().length;
      if (typeof field.min_length === 'number' && len < field.min_length) {
        return `${field.label || key} must be at least ${field.min_length} characters`;
      }
      if (typeof field.max_length === 'number' && len > field.max_length) {
        return `${field.label || key} must be at most ${field.max_length} characters`;
      }
    }

    return '';
  }, []);

  const onFieldChange = useCallback(
    (field: PreviewField, nextValue: any) => {
      const key = field.field_code;

      setValues((prev) => ({ ...prev, [key]: nextValue }));

      const ov = computedOverrides[key];
      const err = validateField(field, nextValue, ov);
      setErrors((prev) => {
        const copy = { ...prev };
        if (err) copy[key] = err;
        else delete copy[key];
        return copy;
      });
    },
    [computedOverrides, validateField],
  );

  const onFieldBlur = useCallback(
    (field: PreviewField) => {
      const key = field.field_code;
      const value = values[key];
      const ov = computedOverrides[key];
      const err = validateField(field, value, ov);
      setErrors((prev) => {
        const copy = { ...prev };
        if (err) copy[key] = err;
        else delete copy[key];
        return copy;
      });
    },
    [computedOverrides, validateField, values],
  );

  const getCascadedOptions = useCallback(
    (field: PreviewField): PreviewOption[] => {
      const oc: any = (field as any).option_config;
      if (!oc || oc.source_type !== 'MASTER' || !oc.master_table_id || !oc.parent_builder_field_id) return [];
      const parentCode = fieldIdToCode.get(Number(oc.parent_builder_field_id));
      const parentVal = parentCode ? values[parentCode] : null;
      if (isEmptyValue(parentVal)) return [];

      const cacheKey = `master:${Number(oc.master_table_id)}:parent:${JSON.stringify(parentVal ?? null)}`;
      return optionsCacheRef.current[cacheKey] ?? [];
    },
    [fieldIdToCode, values],
  );

  const renderInput = useCallback(
    (field: PreviewField) => {
      const key = field.field_code;
      const value = values[key];
      const ov = computedOverrides[key];

      const disabled = fieldDisabled(field.is_editable, field.is_readonly, ov);
      const baseOpts = normalizeOptions(field.options);
      const cascadedOpts = getCascadedOptions(field);
      const opts = baseOpts.length ? baseOpts : normalizeOptions(cascadedOpts);

      const commonClass = `w-100 ${errors[key] ? 'p-invalid' : ''}`;

      switch (field.input_type) {
        case 'textarea':
          return (
            <InputTextarea
              className={commonClass}
              value={value ?? ''}
              onChange={(e) => onFieldChange(field, e.target.value)}
              onBlur={() => onFieldBlur(field)}
              rows={4}
              autoResize
              disabled={disabled}
            />
          );

        case 'number':
          return (
            <InputNumber
              className={commonClass}
              value={typeof value === 'number' ? value : value ?? null}
              onValueChange={(e) => onFieldChange(field, e.value)}
              onBlur={() => onFieldBlur(field)}
              disabled={disabled}
              useGrouping={false}
              step={field.step ? Number(field.step) : undefined}
            />
          );

        case 'select':
          return (
            <Dropdown
              className={commonClass}
              value={value ?? null}
              options={opts}
              onChange={(e) => onFieldChange(field, e.value)}
              onBlur={() => onFieldBlur(field)}
              placeholder="Select"
              disabled={disabled}
              appendTo={appendTo}
              scrollHeight="300px"
              panelStyle={{ minWidth: '12rem' }}
              showClear
              filter
              filterPlaceholder="Search..."
              emptyFilterMessage="No matches"
            />
          );

        case 'radio':
          return (
            <div className="d-flex flex-column gap-2">
              {opts.length === 0 ? (
                <small className="text-muted">No options configured</small>
              ) : (
                opts.map((o) => (
                  <label key={`${key}:${String(o.value)}`} className="d-flex align-items-center gap-2">
                    <RadioButton
                      inputId={`${key}:${String(o.value)}`}
                      name={key}
                      value={o.value}
                      onChange={(e) => onFieldChange(field, e.value)}
                      checked={value === o.value}
                      disabled={disabled || Boolean(o.disabled)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))
              )}
            </div>
          );

        case 'checkbox': {
          if (opts.length > 0) {
            const arr: any[] = Array.isArray(value) ? value : [];
            return (
              <div className="d-flex flex-column gap-2">
                {opts.map((o) => (
                  <label key={`${key}:${String(o.value)}`} className="d-flex align-items-center gap-2">
                    <Checkbox
                      inputId={`${key}:${String(o.value)}`}
                      checked={arr.includes(o.value)}
                      onChange={(e) => {
                        const checked = e.checked;
                        const next = checked ? [...arr, o.value] : arr.filter((x) => x !== o.value);
                        onFieldChange(field, next);
                      }}
                      disabled={disabled || Boolean(o.disabled)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            );
          }

          return (
            <div className="d-flex align-items-center gap-2">
              <Checkbox
                inputId={key}
                checked={Boolean(value)}
                onChange={(e) => onFieldChange(field, e.checked)}
                disabled={disabled}
              />
              <label htmlFor={key} className="m-0">
                {field.label}
              </label>
            </div>
          );
        }

        case 'email':
        case 'password':
        case 'tel':
        case 'url':
        case 'date':
        case 'datetime-local':
        case 'time':
        case 'text':
        default:
          return (
            <InputText
              className={commonClass}
              type={field.input_type || 'text'}
              value={value ?? ''}
              onChange={(e) => onFieldChange(field, e.target.value)}
              onBlur={() => onFieldBlur(field)}
              disabled={disabled}
            />
          );
      }
    },
    [appendTo, computedOverrides, errors, getCascadedOptions, onFieldBlur, onFieldChange, values],
  );

  const addRow = useCallback((group: PreviewAddMoreGroup) => {
    setAddMoreValues((prev) => {
      const current = prev[group.id] ?? [];
      const maxRows = group.max_rows ?? null;
      if (typeof maxRows === 'number' && current.length >= maxRows) return prev;
      return { ...prev, [group.id]: [...current, {}] };
    });
  }, []);

  const removeRow = useCallback((group: PreviewAddMoreGroup, rowIndex: number) => {
    setAddMoreValues((prev) => {
      const current = prev[group.id] ?? [];
      const minRows = Math.max(1, Number(group.min_rows ?? 1));
      if (current.length <= minRows) return prev;
      return { ...prev, [group.id]: current.filter((_, idx) => idx !== rowIndex) };
    });
  }, []);

  const onAddMoreCellChange = useCallback((groupId: number, rowIndex: number, column: PreviewAddMoreColumn, nextValue: any) => {
    const key = column.field_code;

    setAddMoreValues((prev) => {
      const rows = prev[groupId] ?? [];
      const nextRows = rows.map((row, idx) => (idx === rowIndex ? { ...row, [key]: nextValue } : row));
      return { ...prev, [groupId]: nextRows };
    });
  }, []);

  const renderAddMoreColumnInput = useCallback(
    (groupId: number, rowIndex: number, col: PreviewAddMoreColumn, rowValues: Record<string, any>) => {
      const key = col.field_code;
      const value = rowValues[key];
      const disabled = fieldDisabled(col.is_editable, col.is_readonly);
      const commonClass = 'w-100';

      switch (col.input_type) {
        case 'textarea':
          return (
            <InputTextarea
              className={commonClass}
              value={value ?? ''}
              onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.target.value)}
              rows={3}
              autoResize
              disabled={disabled}
            />
          );

        case 'number':
          return (
            <InputNumber
              className={commonClass}
              value={typeof value === 'number' ? value : value ?? null}
              onValueChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value)}
              disabled={disabled}
              useGrouping={false}
              step={col.step ? Number(col.step) : undefined}
            />
          );

        default:
          return (
            <InputText
              className={commonClass}
              type={col.input_type || 'text'}
              value={value ?? ''}
              onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.target.value)}
              disabled={disabled}
            />
          );
      }
    },
    [onAddMoreCellChange],
  );

  const renderAddMoreGroup = useCallback(
    (group: PreviewAddMoreGroup) => {
      const rows = addMoreValues[group.id] ?? [];
      const maxRows = group.max_rows ?? null;

      return (
        <div className="border rounded-3 p-3 bg-white">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex flex-column">
              <div className="fw-semibold">{group.label}</div>
              <small className="text-muted">
                Rows: {rows.length}
                {typeof maxRows === 'number' ? ` / ${maxRows}` : ''} • Min: {group.min_rows ?? 1}
              </small>
            </div>

            <div className="d-flex gap-2">
              <Button
                type="button"
                label="Add Row"
                icon="pi pi-plus"
                size="small"
                onClick={() => addRow(group)}
                disabled={typeof maxRows === 'number' ? rows.length >= maxRows : false}
              />
            </div>
          </div>

          <div className="mt-3 d-flex flex-column gap-3">
            {rows.length === 0 ? (
              <small className="text-muted">No rows</small>
            ) : (
              rows.map((row, rowIndex) => (
                <div key={`${group.id}:${rowIndex}`} className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-semibold">Row {rowIndex + 1}</div>
                    <Button
                      type="button"
                      label="Remove"
                      icon="pi pi-trash"
                      severity="danger"
                      outlined
                      size="small"
                      onClick={() => removeRow(group, rowIndex)}
                      disabled={rows.length <= Math.max(1, Number(group.min_rows ?? 1))}
                    />
                  </div>

                  <div className="row g-3 mt-1">
                    {(group.columns ?? [])
                      .slice()
                      .sort((a, b) => (a.col_order ?? 0) - (b.col_order ?? 0))
                      .map((col) => (
                        <div key={`${group.id}:${rowIndex}:${col.field_code}`} className="col-12 col-md-6 col-lg-4">
                          <label className="form-label fw-semibold">{col.label}</label>
                          {col.help_text ? <small className="text-muted d-block mb-1">{col.help_text}</small> : null}
                          {renderAddMoreColumnInput(group.id, rowIndex, col, row)}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    },
    [addMoreValues, addRow, removeRow, renderAddMoreColumnInput],
  );

  const renderField = useCallback(
    (field: PreviewField) => {
      const key = field.field_code;
      const ov = computedOverrides[key];
      const visible = ov?.visible ?? true;
      const required = ov?.required ?? field.is_required === 'Y';

      if (!visible) return null;

      if (field.input_type === 'addmore') {
        const groups = field.add_more_groups ?? [];
        return (
          <div className="d-flex flex-column gap-3">
            {groups.length === 0 ? (
              <Message severity="warn" text="No AddMore group configured for this field." />
            ) : (
              groups.map((g) => <div key={`group:${g.id}`}>{renderAddMoreGroup(g)}</div>)
            )}
          </div>
        );
      }

      return (
        <div>
          <label className="form-label fw-semibold d-flex align-items-center gap-2">
            <span>{field.label}</span>
            {required ? <span className="text-danger">*</span> : null}
          </label>

          {field.help_text ? <small className="text-muted d-block mb-1">{field.help_text}</small> : null}

          {renderInput(field)}

          {errors[key] ? <small className="text-danger d-block mt-1">{errors[key]}</small> : null}
        </div>
      );
    },
    [computedOverrides, errors, renderAddMoreGroup, renderInput],
  );

  const onPrev = useCallback(() => setActivePageIndex((p) => Math.max(0, p - 1)), []);
  const onNext = useCallback(() => setActivePageIndex((p) => Math.min(pages.length - 1, p + 1)), [pages.length]);

  const leftNav = useMemo(() => {
    return (
      <div className="border rounded-3 bg-white overflow-hidden">
        <div
          className="px-3 py-3"
          style={{
            background: 'linear-gradient(135deg, #0b4a7a 0%, #0e6aa8 60%, #0fb0d0 100%)',
            color: '#fff',
          }}
        >
          <div className="fw-semibold">Preview Steps</div>
          <small style={{ opacity: 0.9 }}>Navigate pages like an investor</small>
        </div>

        <div className="p-2">
          {pages.length === 0 ? (
            <div className="p-3 text-muted">No pages configured.</div>
          ) : (
            <div className="list-group list-group-flush">
              {pages.map((p, idx) => {
                const active = idx === activePageIndex;
                return (
                  <button
                    key={`nav:${p.id}`}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${active ? 'active' : ''}`}
                    onClick={() => setActivePageIndex(idx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="d-flex flex-column text-start">
                      <span className="fw-semibold">{p.page_name || `Page ${idx + 1}`}</span>
                      <small className={active ? 'text-white-50' : 'text-muted'}>Order: {p.preference}</small>
                    </span>
                    <span className={`badge ${active ? 'bg-light text-dark' : 'bg-secondary'}`}>{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }, [activePageIndex, pages]);

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Skeleton width="60%" height="2rem" />
          <div className="d-flex gap-2">
            <Skeleton width="8rem" height="2.2rem" />
            <Skeleton width="8rem" height="2.2rem" />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-3">
            <Skeleton height="20rem" />
          </div>
          <div className="col-12 col-lg-9">
            <Skeleton height="25rem" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const msg =
      (error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load preview definition.';

    return (
      <div className="container-fluid py-4">
        <Message severity="error" text={msg} />
        <div className="mt-3 d-flex gap-2">
          <Button label="Retry" icon="pi pi-refresh" onClick={() => refetch()} />
          <Link
            href={`/${locale}/admin/master/form-builder/services/${serviceId}/forms/${formTypeId}/builder`}
            className="btn btn-outline-secondary"
          >
            Back to Builder
          </Link>
        </div>
      </div>
    );
  }

  const note = (data as any)?.note as string | undefined;

  return (
    <div className="container-fluid py-4">
      <div className="mb-3">
        <div
          className="rounded-4 p-4 d-flex flex-column gap-2"
          style={{
            background: 'radial-gradient(circle at top left, #0fb0d0 0%, #0e6aa8 45%, #0b4a7a 100%)',
            color: '#fff',
          }}
        >
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div className="d-flex flex-column">
              <div className="text-uppercase" style={{ letterSpacing: '0.06em', opacity: 0.95 }}>
                Investor Preview (No Submission)
              </div>
              <h2 className="m-0" style={{ fontWeight: 700 }}>
                {headerTitle}
              </h2>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Link
                href={`/${locale}/admin/master/form-builder/services/${serviceId}/forms/${formTypeId}/builder`}
                className="btn btn-light"
                style={{ borderRadius: 10 }}
              >
                <i className="pi pi-arrow-left me-2" />
                Back to Builder
              </Link>
              <Button
                type="button"
                label="Reset Preview"
                icon="pi pi-refresh"
                severity="secondary"
                onClick={resetAll}
                rounded
              />
            </div>
          </div>

          {note ? (
            <div className="mt-1">
              <span className="badge bg-light text-dark px-3 py-2" style={{ borderRadius: 999 }}>
                {note}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-3">{leftNav}</div>

        <div className="col-12 col-lg-9">
          <div className="border rounded-4 bg-white overflow-hidden">
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex flex-column">
                <div className="fw-semibold">
                  {activePage?.page_name || (pages.length ? `Page ${activePageIndex + 1}` : 'No Page')}
                </div>
                <small className="text-muted">
                  Step {pages.length ? activePageIndex + 1 : 0} of {pages.length}
                </small>
              </div>

              <div className="d-flex gap-2">
                <Button
                  type="button"
                  label="Previous"
                  icon="pi pi-angle-left"
                  outlined
                  onClick={onPrev}
                  disabled={activePageIndex <= 0}
                />
                <Button
                  type="button"
                  label={activePageIndex >= pages.length - 1 ? 'Finish' : 'Next'}
                  icon="pi pi-angle-right"
                  iconPos="right"
                  onClick={onNext}
                  disabled={pages.length === 0 || activePageIndex >= pages.length - 1}
                />
              </div>
            </div>

            <div className="p-4">
              {pages.length === 0 ? (
                <Message severity="warn" text="No pages found for this service/form type. Add pages in Builder first." />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <div className="d-flex flex-column gap-4">
                    {(activePage?.categories ?? [])
                      .slice()
                      .sort((a, b) => (a.preference ?? 0) - (b.preference ?? 0))
                      .map((cat) => (
                        <div key={`cat:${cat.page_category_mapping_id}`} className="border rounded-4 p-4 bg-light">
                          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                            <div className="d-flex flex-column">
                              <div className="fw-semibold fs-5">{cat.category_name}</div>
                              {cat.help_text ? <small className="text-muted">{cat.help_text}</small> : null}
                            </div>
                            <span className="badge bg-secondary">Order: {cat.preference}</span>
                          </div>

                          <div className="mt-3 row g-3">
                            {(cat.fields ?? [])
                              .slice()
                              .sort((a, b) => (a.preference ?? 0) - (b.preference ?? 0))
                              .map((field) => {
                                const node = renderField(field);
                                if (!node) return null;
                                return (
                                  <div
                                    key={`field:${field.id}`}
                                    className={field.input_type === 'addmore' ? 'col-12' : 'col-12 col-md-6'}
                                  >
                                    {node}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}

                    <div className="d-flex justify-content-end">
                      <Message severity="info" text="Preview only — this will not submit or save data anywhere." />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="mt-3 border rounded-4 bg-white p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="fw-semibold">Preview State (Local Only)</div>
              <small className="text-muted">Stored in-memory for this page session. Refresh clears it.</small>
            </div>

            <details className="mt-2">
              <summary className="text-primary" style={{ cursor: 'pointer' }}>
                View current values (no submission)
              </summary>
              <pre className="mt-2 p-3 bg-light rounded-3" style={{ maxHeight: 280, overflow: 'auto' }}>
                {JSON.stringify({ values, addMoreValues, rulesApplied: computedOverrides }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
