"use client";

import { useMemo } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

interface Props {
  value: any;
  formData: any;
  onChange: (val: any) => void;
  policyOptions: { label: string; value: number }[];
  schemeOptions: {
    label: string;
    value: string;
    policy_id: number; // <--- each scheme must have a policy_id
    form_structure_json: string | object;
  }[];
}

export const CascadingConfigBuilder = ({
  value,
  formData,
  onChange,
  policyOptions,
  schemeOptions,
}: Props) => {
  const config = value || {};

  // Selected policy
  const selectedPolicy = useMemo(() => {
    const policyId = config?.trigger?.policy_id ?? formData.policy_id;
    return policyOptions.find((p) => String(p.value) === String(policyId));
  }, [policyOptions, config?.trigger?.policy_id, formData.policy_id]);

  const filteredSchemes = useMemo(
    () =>
      schemeOptions.filter(
        (s) => String(s.policy_id) === String(selectedPolicy?.value),
      ),
    [schemeOptions, selectedPolicy],
  );

  // Selected scheme
  const selectedScheme = useMemo(
    () => filteredSchemes.find((s) => s.value === config?.trigger?.scheme_code),
    [filteredSchemes, config?.trigger?.scheme_code],
  );

  // Field options based on scheme
  const fieldOptions = useMemo(() => {
    if (!selectedScheme?.form_structure_json) return [];

    let schema;
    if (typeof selectedScheme.form_structure_json === "string") {
      try {
        schema = JSON.parse(selectedScheme.form_structure_json);
      } catch {
        console.error("Invalid JSON in form_structure_json");
        return [];
      }
    } else {
      schema = selectedScheme.form_structure_json; // already object
    }

    return schema.sections.flatMap((section: any) =>
      section.fields.map((field: any) => ({
        label: field.label_override || field.field_code,
        value: field.field_code,
      })),
    );
  }, [selectedScheme]);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-1">Cascading Configuration</h5>
        <div className="d-flex gap-2">
          <Button
            label="Clear Cascading Config"
            icon="pi pi-trash"
            outlined
            type="button"
            severity="secondary"
            onClick={() => onChange({})}
          />
        </div>
      </div>

      <div className="p-3 card">
        <div className="row mb-3">
          {/* Trigger Level */}
          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Trigger Level</label>
            <Dropdown
              className="w-100"
              value={config?.trigger?.level}
              options={[
                { label: "On Schema Opening", value: "schema_opening" },
                { label: "On Field Change", value: "field_change" },
              ]}
              onChange={(e) =>
                onChange({
                  ...config,
                  trigger: { ...config.trigger, level: e.value },
                })
              }
            />
          </div>

          {/* Policy */}
          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Policy</label>
            <Dropdown
              value={config?.trigger?.policy_id || formData.policy_id}
              options={policyOptions}
              placeholder="Select Policy"
              className="w-100"
              filter
              onChange={(e) => {
                // When policy changes, reset scheme & field
                onChange({
                  ...config,
                  trigger: {
                    ...config.trigger,
                    policy_id: e.value,
                    scheme_code: null,
                    field_code: null,
                  },
                });
              }}
            />
          </div>

          {/* Scheme filtered by selected policy */}
          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Scheme</label>
            <Dropdown
              className="w-100"
              value={config?.trigger?.scheme_code}
              options={filteredSchemes}
              placeholder="Select Scheme"
              onChange={(e) =>
                onChange({
                  ...config,
                  trigger: {
                    ...config.trigger,
                    scheme_code: e.value,
                    field_code: null,
                  },
                })
              }
            />
          </div>

          {/* Trigger Field */}
          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Trigger Field</label>
            <Dropdown
              className="w-100"
              value={config?.trigger?.field_code}
              options={fieldOptions}
              placeholder="Select Field"
              onChange={(e) =>
                onChange({
                  ...config,
                  trigger: { ...config.trigger, field_code: e.value },
                })
              }
            />
          </div>
        </div>

        <hr />

        {/* Condition Operator & Value */}
        <div className="row mb-3">
          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Condition Operator</label>
            <Dropdown
              className="w-100"
              value={config?.condition?.operator}
              options={[
                { label: "Equals", value: "equals" },
                { label: "Not Equals", value: "not_equals" },
                { label: "Greater Than", value: "greater_than" },
                { label: "Less Than", value: "less_than" },
              ]}
              onChange={(e) =>
                onChange({
                  ...config,
                  condition: { ...config.condition, operator: e.value },
                })
              }
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="fw-semibold">Condition Value</label>
            <InputText
              className="w-100"
              value={config?.condition?.value ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  condition: { ...config.condition, value: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
