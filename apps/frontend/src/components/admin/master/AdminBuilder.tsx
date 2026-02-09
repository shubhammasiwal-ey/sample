"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { useFields } from "@/hooks/master/useFields";
import { useUsers } from "@/hooks/useAdminData";
import { MultiSelect } from "primereact/multiselect";

/* -------------------- Types -------------------- */

interface ValidationConfig {
  min?: number;
  max?: number;
  regex?: string;
  errorMessage?: string;
}
interface WorkflowStage {
  current_role?: string;
  next_role?: string[];
}

interface WorkflowConfig {
  stages?: WorkflowStage[];
}

interface SectionField {
  fieldCode?: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  fieldType: "text" | "number" | "date" | "select";
  options?: { label: string; value: string }[];
  validation?: ValidationConfig;
  assignedUsers?: string[]; // 👈 ADD THIS
  showSettings?: boolean; // UI toggle only
}

interface SectionConfig {
  sectionTitle: string;
  description?: string;
  step: number;
  gridCols: 1 | 2 | 3;
  fields: SectionField[];
}

export interface AdminConfig {
  sections: SectionConfig[];
}

/* -------------------- Component -------------------- */

interface AdminBuilderProps {
  value?: AdminConfig;
  onChange: (config: AdminConfig) => void;
  workflowConfig?: WorkflowConfig; // 👈 add this
}

export function AdminBuilder({
  value,
  onChange,
  workflowConfig,
}: AdminBuilderProps) {
  const { data: fieldMasterFields = [] } = useFields();
  const [showJson, setShowJson] = useState(false);

  // Controlled state
  const [config, setConfig] = useState<AdminConfig>(value || { sections: [] });
  const { data: users = [] } = useUsers();

  const departmentUsers = users.filter(
    (user) => user.user_type === "DEPARTMENT",
  );

  const departmentUserOptions = departmentUsers.map((user) => ({
    label: `${user.role.name} - ${user.email}`,
    value: user.id,
  }));
  const allowedWorkflowUserIds = useMemo(() => {
    if (!workflowConfig?.stages) return [];

    const ids = new Set<string>();

    workflowConfig.stages.forEach((stage) => {
      if (stage.current_role) {
        ids.add(stage.current_role);
      }

      stage.next_role?.forEach((r) => ids.add(r));
    });

    return Array.from(ids);
  }, [workflowConfig]);
  const workflowUserOptions = useMemo(() => {
    return departmentUserOptions.filter((opt) =>
      allowedWorkflowUserIds.includes(String(opt.value)),
    );
  }, [departmentUserOptions, allowedWorkflowUserIds]);
  /* -------------------- Sync parent value -------------------- */
  useEffect(() => {
    if (value) {
      setConfig({ sections: value.sections || [] });
    }
  }, [value]);

  /* -------------------- Helper to update config -------------------- */
  const updateConfig = (newConfig: AdminConfig) => {
    setConfig(newConfig);
    onChange(newConfig);
  };

  /* -------------------- Master Fields -------------------- */
  const masterFieldOptions = useMemo(
    () =>
      fieldMasterFields.map((f: any) => ({
        label: `${f.field_code} (${f.field_label})`,
        value: f.field_code,
      })),
    [fieldMasterFields],
  );

  /* -------------------- Section Handlers -------------------- */
  const addSection = () => {
    updateConfig({
      sections: [
        ...config.sections,
        {
          sectionTitle: "",
          description: "",
          step: config.sections.length + 1,
          gridCols: 3,
          fields: [],
        },
      ],
    });
  };

  const updateSection = (index: number, data: Partial<SectionConfig>) => {
    const sections = [...config.sections];
    sections[index] = { ...sections[index], ...data };
    updateConfig({ sections });
  };

  const removeSection = (index: number) => {
    updateConfig({ sections: config.sections.filter((_, i) => i !== index) });
  };

  /* -------------------- Field Handlers -------------------- */
  const addField = (sectionIndex: number) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields.push({
      label: "",
      fieldType: "text",
      required: true,
      validation: {},
      showSettings: false,
    });
    updateConfig({ sections });
  };

  const updateField = (
    sectionIndex: number,
    fieldIndex: number,
    data: Partial<SectionField>,
  ) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields[fieldIndex] = {
      ...sections[sectionIndex].fields[fieldIndex],
      ...data,
    };
    updateConfig({ sections });
  };

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields.splice(fieldIndex, 1);
    updateConfig({ sections });
  };

  const onSelectMasterField = (
    sectionIndex: number,
    fieldIndex: number,
    fieldCode: string,
  ) => {
    const master = fieldMasterFields.find(
      (f: any) => f.field_code === fieldCode,
    );
    if (!master) return;

    updateField(sectionIndex, fieldIndex, {
      fieldCode: master.field_code,
      label: master.field_label,
      fieldType: master.component_type || "text",
      options: master.options || [],
    });
  };

  const moveField = (
    sectionIndex: number,
    fromIndex: number,
    toIndex: number,
  ) => {
    if (toIndex < 0) return;

    const sections = [...config.sections];
    const fields = [...sections[sectionIndex].fields];
    if (toIndex >= fields.length) return;

    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    sections[sectionIndex].fields = fields;
    updateConfig({ sections });
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-1">Admin View Builder</h5>
        <div className="d-flex gap-2">
          <Button
            label={showJson ? "Hide JSON" : "View JSON"}
            icon="pi pi-code"
            outlined
            type="button"
            onClick={() => setShowJson(!showJson)}
          />
          <Button
            type="button"
            label="Add Section"
            icon="pi pi-plus"
            severity="success"
            onClick={addSection}
          />
        </div>
      </div>
      <div className="card">
        {(config.sections || []).map((section, sIndex) => (
          <Card key={sIndex}>
            <div className="d-flex justify-content-between mb-3">
              <strong>Step {section.step}</strong>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                type="button"
                onClick={() => removeSection(sIndex)}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">
                  Section Title <span className="text-danger">*</span>
                </label>
                <InputText
                  value={section.sectionTitle}
                  onChange={(e) =>
                    updateSection(sIndex, { sectionTitle: e.target.value })
                  }
                  className="w-100"
                  placeholder="Enter section title"
                />
              </div>

              <div className="col-md-5">
                <label className="form-label">Description</label>
                <InputTextarea
                  value={section.description}
                  onChange={(e) =>
                    updateSection(sIndex, { description: e.target.value })
                  }
                  rows={2}
                  className="w-100"
                  placeholder="Optional helper text for this section"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Grid</label>
                <Dropdown
                  value={section.gridCols}
                  options={[
                    { label: "1 Column", value: 1 },
                    { label: "2 Columns", value: 2 },
                    { label: "3 Columns", value: 3 },
                  ]}
                  onChange={(e) => updateSection(sIndex, { gridCols: e.value })}
                  className="w-100"
                />
              </div>
            </div>

            <hr className="my-3" />

            <div className="d-flex justify-content-between mb-2">
              <h6>Fields</h6>
              <Button
                type="button"
                label="Add Field"
                icon="pi pi-plus"
                size="small"
                onClick={() => addField(sIndex)}
              />
            </div>

            {section.fields.map((field, fIndex) => (
              <Card
                key={fIndex}
                className="mb-3 border"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong>Field {fIndex + 1}</strong>
                  <div className="d-flex gap-2 align-items-center">
                    {section.fields.length > 1 && (
                      <Button
                        icon="pi pi-arrow-up"
                        type="button"
                        className="p-button-text"
                        disabled={fIndex === 0}
                        tooltip="Move Up"
                        onClick={() => moveField(sIndex, fIndex, fIndex - 1)}
                      />
                    )}
                    {section.fields.length > 1 && (
                      <Button
                        icon="pi pi-arrow-down"
                        type="button"
                        className="p-button-text"
                        disabled={fIndex === section.fields.length - 1}
                        tooltip="Move Down"
                        onClick={() => moveField(sIndex, fIndex, fIndex + 1)}
                      />
                    )}
                    <Button
                      icon="pi pi-cog"
                      type="button"
                      className="p-button-text"
                      tooltip="Field Settings"
                      onClick={() =>
                        updateField(sIndex, fIndex, {
                          showSettings: !field.showSettings,
                        })
                      }
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      type="button"
                      tooltip="Remove Field"
                      onClick={() => removeField(sIndex, fIndex)}
                    />
                  </div>
                </div>

                <div className="row g-3 align-items-start">
                  <div className="col-md-1 text-center">
                    <label className="form-label d-block">Required</label>
                    <Checkbox
                      checked={field.required ?? true}
                      onChange={(e) =>
                        updateField(sIndex, fIndex, { required: e.checked })
                      }
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label">Master Field</label>
                    <Dropdown
                      value={field.fieldCode}
                      options={masterFieldOptions}
                      onChange={(e) =>
                        onSelectMasterField(sIndex, fIndex, e.value)
                      }
                      className="w-100"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Placeholder</label>
                    <InputText
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(sIndex, fIndex, {
                          placeholder: e.target.value,
                        })
                      }
                      className="w-100"
                    />
                  </div>
                </div>

                {field.showSettings && (
                  <div
                    className="row g-3 mt-3 border-top pt-3"
                    style={{ borderRadius: 6 }}
                  >
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Assigned Department Users
                      </label>

                      <MultiSelect
                        value={field.assignedUsers || []}
                        options={workflowUserOptions}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            assignedUsers: e.value || [],
                          })
                        }
                        placeholder="Select Department Users"
                        className="w-100"
                        display="chip"
                        showClear
                      />

                      <small className="text-muted">
                        Users are derived from workflow (current & next roles)
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Help Text</label>
                      <InputTextarea
                        value={field.description}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            description: e.target.value,
                          })
                        }
                        className="w-100"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Label Override</label>
                      <InputText
                        value={field.label}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, { label: e.target.value })
                        }
                        className="w-100"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Regex Pattern</label>
                      <InputText
                        value={field.validation?.regex}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            validation: {
                              ...field.validation,
                              regex: e.target.value,
                            },
                          })
                        }
                        className="w-100"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Min Value</label>
                      <InputText
                        type="number"
                        value={field.validation?.min?.toString() ?? ""}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            validation: {
                              ...field.validation,
                              min:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          })
                        }
                        className="w-100"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Max Value</label>
                      <InputText
                        type="number"
                        value={field.validation?.max?.toString() ?? ""}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            validation: {
                              ...field.validation,
                              max:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          })
                        }
                        className="w-100"
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Error Message</label>
                      <InputText
                        value={field.validation?.errorMessage}
                        onChange={(e) =>
                          updateField(sIndex, fIndex, {
                            validation: {
                              ...field.validation,
                              errorMessage: e.target.value,
                            },
                          })
                        }
                        className="w-100"
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </Card>
        ))}

        {showJson && (
          <InputTextarea
            value={JSON.stringify(config, null, 2)}
            rows={14}
            className="w-100"
            readOnly
            style={{ fontFamily: "monospace" }}
          />
        )}
      </div>
    </div>
  );
}
