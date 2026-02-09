"use client";

import { useState, useMemo } from "react";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { useDocumentMasters } from "@/hooks/master/useDocumentMasters";

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

const DOCUMENT_TYPES = [
  { label: "PDF", value: "pdf" },
  { label: "JPG", value: "jpg" },
  { label: "PNG", value: "png" },
  { label: "DOC", value: "doc" },
  { label: "DOCX", value: "docx" },
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

// ---------------- RequiredDocumentsBuilder ----------------
interface Props {
  value: { documents: any[] };
  onChange: (val: { documents: any[] }) => void;
  availableFields: { label: string; value: string }[];
}

export const RequiredDocumentsBuilder = ({
  value,
  onChange,
  availableFields,
}: Props) => {
  const { data: documentMasters = [], isLoading } = useDocumentMasters();

  const documentOptions = useMemo(
    () =>
      documentMasters.map((doc: any) => ({
        label: `${doc.checklistDocumentName} (${doc.checklistDocumentExtension})`,
        value: doc.id,
        meta: doc,
      })),
    [documentMasters],
  );

  const updateDocument = (index: number, updated: any) => {
    const docs = [...value.documents];
    docs[index] = { ...docs[index], ...updated };
    onChange({ documents: docs });
  };

  const addDocument = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange({
      documents: [
        ...value.documents,
        {
          document_id: null,
          is_mandatory: true,
          max_size_mb: 5,
          allowed_types: [],
          description: "",
          condition: undefined,
          show_beside_field: null,
        },
      ],
    });
  };

  const removeDocument = (index: number) => {
    onChange({ documents: value.documents.filter((_, i) => i !== index) });
  };
  console.log(value.documents);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-1">Required Documents</h5>
        <div className="d-flex gap-2">
          <Button
            label="Add Document"
            icon="pi pi-plus"
            severity="success"
            type="button"
            onClick={addDocument}
            className="align-self-start"
          />
        </div>
      </div>
      {value.documents.map((doc, index) => (
        <div key={index} className="card p-3">
          <div className="row g-3 align-items-end">
            {/* Document */}
            <div className="col-md-3">
              <label className="form-label fw-semibold">Document</label>
              <Dropdown
                value={doc.document_id || null}
                options={documentOptions}
                optionLabel="label"
                optionValue="value"
                loading={isLoading}
                filter
                filterBy="label"
                placeholder="Search document"
                className="w-100"
                onChange={(e) =>
                  updateDocument(index, {
                    document_id: e.value,
                    document_meta: documentOptions.find(
                      (o) => o.value === e.value,
                    )?.meta,
                  })
                }
              />
            </div>

            {/* Max Size */}
            <div className="col-md-3">
              <label className="form-label fw-semibold">Max Size (MB)</label>
              <InputNumber
                value={doc.max_size_mb || 5}
                min={1}
                max={50}
                className="w-100"
                onValueChange={(e) =>
                  updateDocument(index, { max_size_mb: e.value })
                }
              />
            </div>

            {/* Allowed Types */}
            <div className="col-md-3">
              <label className="form-label fw-semibold">Allowed Types</label>
              <MultiSelect
                value={doc.allowed_types || []}
                options={DOCUMENT_TYPES}
                placeholder="Select types"
                display="chip"
                className="w-100"
                onChange={(e) =>
                  updateDocument(index, { allowed_types: e.value })
                }
              />
            </div>

            {/* Mandatory */}
            <div className="col-md-2">
              <label className="form-label fw-semibold">Mandatory</label>
              <div>
                <input
                  type="checkbox"
                  checked={doc.is_mandatory || false}
                  onChange={(e) =>
                    updateDocument(index, { is_mandatory: e.target.checked })
                  }
                />
              </div>
            </div>

            {/* Remove */}
            <div className="col-md-1">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                type="button"
                onClick={() => removeDocument(index)}
              />
            </div>
          </div>
          <div className="row g-3">
            {/* Show Beside Field (Optional) */}
            <div className="col-md-3">
              <label className="form-label fw-semibold">
                Show Beside Form Field
                <small className="text-muted ms-1">(Optional)</small>
              </label>

              <Dropdown
                value={doc.show_beside_field || null}
                options={availableFields}
                optionLabel="label"
                optionValue="value"
                placeholder="Select form field"
                className="w-100"
                showClear
                filter
                onChange={(e) =>
                  updateDocument(index, {
                    show_beside_field: e.value || null,
                  })
                }
              />
            </div>

            {/* Description */}
            <div className="col-md-9">
              <label className="form-label fw-semibold">
                Description (Investor Notes)
              </label>
              <InputTextarea
                value={doc.description || ""}
                onChange={(e) =>
                  updateDocument(index, { description: e.target.value })
                }
                className="w-100"
                rows={3}
                autoResize
                placeholder="Enter notes for investor"
              />
            </div>
          </div>

          {/* Conditional Rendering */}
          <div className="mt-3">
            <label className="form-label small fw-semibold">
              Conditional Rendering
            </label>
            <ConditionEditor
              condition={doc.condition}
              availableFields={availableFields} // pass all fields
              onChange={(cond: FieldCondition | undefined) =>
                updateDocument(index, { condition: cond })
              }
              onRemove={() => updateDocument(index, { condition: undefined })}
            />

            {doc.condition && (
              <Tag
                value="Conditional"
                severity="warning"
                icon="pi pi-eye"
                className="mt-2"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
