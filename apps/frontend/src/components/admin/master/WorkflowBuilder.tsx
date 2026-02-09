"use client";

import { useState, useMemo } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import { useUsers } from "@/hooks/useAdminData";

interface FieldCondition {
  field_code: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty"
    | "contains";
  value: any;
}

const CONDITION_OPERATORS = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "not_equals" },
  { label: "In (Array)", value: "in" },
  { label: "Not In (Array)", value: "not_in" },
  { label: "Greater Than", value: "greater_than" },
  { label: "Less Than", value: "less_than" },
  { label: "Is Empty", value: "is_empty" },
  { label: "Is Not Empty", value: "is_not_empty" },
  { label: "Contains", value: "contains" },
];

type WorkflowStage = {
  stage_name: string;
  current_role: string;
  //   role_assign: string;
  next_role?: string[];
  action: string[];
  condition?: FieldCondition;
  timeline_days?: number; // ⬅ optional timeline in days
};

type WorkflowConfig = {
  submit_url: string;
  draft_url?: string;
  stages: WorkflowStage[];
};

type Props = {
  value: WorkflowConfig;
  onChange: (value: WorkflowConfig) => void;
  //   availableRoles: { label: string; value: string }[];
  availableFields: { label: string; value: string }[];
};

const roleOptions = [
  { label: "District Officer", value: "DISTRICT_OFFICER" },
  { label: "State Officer", value: "STATE_OFFICER" },
  { label: "Department Admin", value: "DEPARTMENT_ADMIN" },
  { label: "System Admin", value: "SYSTEM_ADMIN" },
];
// const roleAssignOptions = [
//   { label: "Document Verifier", value: "Document Verifier" },
//   { label: "Forward/Revert", value: "Forward/Revert" },
//   { label: "Approval", value: "Approval" },
//   { label: "Incentive Disbursement", value: "Incentive Disbursement" },
// ];

const actionOptions = [
  { label: "Document Verify", value: "document_verify" },
  { label: "Revert to Applicant", value: "revert_applicant" },
  { label: "Revert to Previous User", value: "revert_previous" },
  { label: "Forward", value: "forward" },
  { label: "Reject", value: "reject" },
  { label: "Approve", value: "approve" },
  { label: "Inspection Schedule", value: "inspection_schedule" },
  {
    label: "Inspection Completion Status Update",
    value: "inspection_complete",
  },
];

// ---------------- Condition Editor ----------------
const ConditionEditor = ({
  condition,
  availableFields,
  onChange,
  onRemove,
}: {
  condition?: FieldCondition;
  availableFields: { label: string; value: string }[];
  onChange: (condition: FieldCondition | undefined) => void;
  onRemove: () => void;
}) => {
  const [fieldSearch, setFieldSearch] = useState("");

  const filteredFields = useMemo(() => {
    if (!fieldSearch) return availableFields;
    return availableFields.filter((f) => {
      const label = (f.label || "").toLowerCase();
      const value = (f.value || "").toLowerCase();
      return (
        label.includes(fieldSearch.toLowerCase()) ||
        value.includes(fieldSearch.toLowerCase())
      );
    });
  }, [availableFields, fieldSearch]);

  if (!condition) {
    return (
      <Button
        label="Add Condition"
        icon="pi pi-plus"
        size="small"
        severity="secondary"
        outlined
        type="button"
        onClick={() =>
          onChange({ field_code: "", operator: "equals", value: "" })
        }
      />
    );
  }
  return (
    <div className="p-2 border rounded" style={{ backgroundColor: "#e3f2fd" }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="fw-semibold">Show when:</small>
        <Button
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          rounded
          type="button"
          onClick={onRemove}
        />
      </div>

      <div className="row g-2">
        <div className="col-4">
          <Dropdown
            value={condition.field_code}
            options={filteredFields}
            onChange={(e) => onChange({ ...condition, field_code: e.value })}
            placeholder="Field"
            className="w-100"
          />
        </div>
        <div className="col-4">
          <Dropdown
            value={condition.operator}
            options={CONDITION_OPERATORS}
            onChange={(e) => onChange({ ...condition, operator: e.value })}
            placeholder="Operator"
            className="w-100"
          />
        </div>
        <div className="col-4">
          <InputText
            value={condition.value?.toString() || ""}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Value"
            className="w-100"
          />
        </div>
      </div>
    </div>
  );
};

// ---------------- Workflow Builder ----------------
export function WorkflowBuilder({
  value,
  onChange,
  //   availableRoles,
  availableFields,
}: Props) {
  const updateStage = (index: number, data: Partial<WorkflowStage>) => {
    const stages = [...value.stages];
    stages[index] = { ...stages[index], ...data };
    onChange({ ...value, stages });
  };

  const addStage = () => {
    onChange({
      ...value,
      stages: [
        ...value.stages,
        {
          stage_name: "",
          current_role: "",
          //   role_assign: "",
          next_role: [],
          action: [],
          timeline_days: undefined, // optional
        },
      ],
    });
  };
  const { data: users = [], isLoading, error } = useUsers();

  const departmentUsers = users.filter(
    (user) => user.user_type === "DEPARTMENT",
  );

  // inside WorkflowBuilder component, after filtering department users
  const departmentRoleOptions = departmentUsers.map((user) => ({
    label: `${user.role.name} - ${user.email}`, // optional: show role and email
    value: user.id, // store user id in value
  }));

  const removeStage = (index: number) => {
    onChange({
      ...value,
      stages: value.stages.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-column gap-4 card">
      {/* API ENDPOINTS */}
      <Card>
        <h5 className="mb-1">API Endpoints</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Submit URL</label>
            <InputText
              value={value.submit_url || ""}
              onChange={(e) =>
                onChange({ ...value, submit_url: e.target.value })
              }
              className="w-100"
              placeholder="/applications/submit"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Draft URL</label>
            <InputText
              value={value.draft_url || ""}
              onChange={(e) =>
                onChange({ ...value, draft_url: e.target.value })
              }
              className="w-100"
              placeholder="/applications/draft"
            />
          </div>
        </div>
      </Card>

      {/* WORKFLOW STAGES */}
      <Card>
        <div className="d-flex justify-content-between align-items-center">
          <div className="mb-1">
            <h5 className="mb-1">Approval Workflow</h5>
            <small className="text-muted">
              Configure stage-wise approval flow
            </small>
          </div>
          <Button
            label="Add Stage"
            icon="pi pi-plus"
            type="button"
            severity="success"
            onClick={addStage}
          />
        </div>
        {value.stages.map((stage, index) => (
          <div key={index} className="border rounded p-3 mb-3 bg-light">
            <div className="d-flex justify-content-between mb-2">
              <strong>Stage {index + 1}</strong>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                type="button"
                onClick={() => removeStage(index)}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Stage Name</label>
                <InputText
                  value={stage.stage_name}
                  onChange={(e) =>
                    updateStage(index, { stage_name: e.target.value })
                  }
                  className="w-100"
                  placeholder="District Approval"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Current Role</label>
                <Dropdown
                  value={stage.current_role}
                  options={departmentRoleOptions} // <-- use filtered users here
                  onChange={(e) =>
                    updateStage(index, { current_role: e.value })
                  }
                  placeholder="Select Department User"
                  className="w-100"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  Timeline (Days)
                  <span className="text-muted ms-1">(Optional)</span>
                </label>

                <InputText
                  type="number"
                  min={0}
                  value={
                    stage.timeline_days !== undefined
                      ? String(stage.timeline_days)
                      : ""
                  }
                  onChange={(e) =>
                    updateStage(index, {
                      timeline_days: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-100"
                  placeholder="e.g. 7"
                />
              </div>

              {/* <div className="col-md-3">
                <label className="form-label">Role Assign</label>
                <Dropdown
                  value={stage.role_assign}
                  options={roleAssignOptions}
                  onChange={(e) => updateStage(index, { role_assign: e.value })}
                  placeholder="Role Assign"
                  className="w-100"
                />
              </div> */}

              <div className="col-md-3">
                <label className="form-label">Action</label>
                <MultiSelect
                  value={stage.action}
                  options={actionOptions}
                  onChange={(e) => updateStage(index, { action: e.value })}
                  placeholder="Select Action"
                  className="w-100"
                  multiple
                  showClear
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Next Role</label>
                <MultiSelect
                  value={stage.next_role || []}
                  options={departmentRoleOptions} // <-- use filtered users here
                  onChange={(e) =>
                    updateStage(index, { next_role: e.value || [] })
                  }
                  placeholder="Select Next Role(s)"
                  className="w-100"
                  multiple
                  showClear
                />
              </div>

              <div className="col-md-12 mt-3">
                <label className="form-label small fw-semibold">
                  Conditional Rendering
                </label>
                <ConditionEditor
                  condition={stage.condition}
                  availableFields={availableFields}
                  onChange={(cond) => updateStage(index, { condition: cond })}
                  onRemove={() => updateStage(index, { condition: undefined })}
                />

                {stage.condition && (
                  <Tag
                    value="Conditional"
                    severity="warning"
                    icon="pi pi-eye"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
