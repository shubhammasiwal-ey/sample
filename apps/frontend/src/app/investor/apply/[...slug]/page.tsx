"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  DynamicFormRenderer,
  useDynamicForm,
} from "@/components/forms/DynamicFormRenderer";
import { useFields } from "@/hooks/master/useFields";
import apiClient from "@/lib/api-client";

// Types
interface SchemeData {
  id: string;
  policy_id: string;
  scheme_name: string;
  scheme_code: string;
  form_structure_json: any[];
  workflow_config?: {
    submit_url?: string;
    draft_url?: string;
    is_multi_step?: boolean;
    stages?: any[];
  };
  version: number;
  is_current_version: boolean;
  valid_from: string;
  valid_to: string;
  policy?: {
    policy_code: string;
    policy_name: string;
  };
}

export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);

  // Extract dynamic params
  const slugArray = params.slug as string[];
  const policyCode = slugArray?.[0];
  const schemeCode = slugArray?.[1];
  const versionParam = slugArray?.[2];

  const [scheme, setScheme] = useState<SchemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const { data: fieldMaster = [], isLoading: fieldsLoading } = useFields();

  const version = versionParam
    ? parseInt(versionParam.replace("v", ""))
    : undefined;

  // Fetch scheme data
  useEffect(() => {
    const fetchScheme = async () => {
      if (!policyCode || !schemeCode) {
        setError("Invalid URL. Please provide policy and scheme codes.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("policy_code", policyCode);
        params.append("scheme_code", schemeCode);
        if (version) {
          params.append("version", version.toString());
        }

        const response = await apiClient.get(
          `/master/schemes/by-code?${params}`
        );
        const data = response.data;

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.id) {
          throw new Error("Scheme not found");
        }

        setScheme(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Failed to load scheme"
        );
        setScheme(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [policyCode, schemeCode, version]);

  // Extract sections from form_structure_json (handles both old array and new object formats)
  // Moved before useDynamicForm so we can pass formSections to the hook for calculations
  const formStructureObj = (scheme?.form_structure_json || {}) as {
    sections?: any[];
    is_multi_step?: boolean;
  };
  const formSections =
    formStructureObj.sections ||
    (Array.isArray(scheme?.form_structure_json)
      ? scheme?.form_structure_json
      : []);

  // Pass formSections to useDynamicForm for calculation support
  const { values, errors, handleChange, setValues, validate, reset } =
    useDynamicForm({}, formSections);

  // Get config from workflow_config
  const submitUrl = scheme?.workflow_config?.submit_url || "/applications";
  const draftUrl = scheme?.workflow_config?.draft_url || "/applications/draft";

  // Check if multi-step from form_structure_json or workflow_config
  const isMultiStepFromForm = formStructureObj.is_multi_step === true;
  const isMultiStep =
    isMultiStepFromForm || scheme?.workflow_config?.is_multi_step === true;

  // Group sections by step_number for multi-step mode
  const stepGroups = isMultiStep
    ? (() => {
        const groups: { stepNumber: number; sections: any[] }[] = [];
        const stepMap = new Map<number, any[]>();

        formSections.forEach((section: any) => {
          const stepNum = section.step_number || 1;
          if (!stepMap.has(stepNum)) {
            stepMap.set(stepNum, []);
          }
          stepMap.get(stepNum)!.push(section);
        });

        // Sort by step number
        const sortedSteps = Array.from(stepMap.entries()).sort(
          (a, b) => a[0] - b[0]
        );
        sortedSteps.forEach(([stepNumber, sections]) => {
          groups.push({ stepNumber, sections });
        });

        return groups;
      })()
    : [];

  const totalSteps = isMultiStep ? stepGroups.length : formSections.length;
  const currentStepSections = isMultiStep
    ? stepGroups[activeStep]?.sections || []
    : [formSections[activeStep]].filter(Boolean);

  // Navigation
  const handleNext = () => {
    // Validate all sections in current step
    let hasErrors = false;
    currentStepSections.forEach((section: any) => {
      const sectionFields = section?.fields || [];
      sectionFields.forEach((field: any) => {
        const value = values[field.field_code];
        if (
          field.required &&
          (!value || (Array.isArray(value) && value.length === 0))
        ) {
          hasErrors = true;
        }
      });
    });

    if (hasErrors) {
      validate(currentStepSections, fieldMaster);
      toastRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fill all required fields.",
        life: 3000,
      });
      return;
    }

    if (activeStep < totalSteps - 1) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      await apiClient.post(draftUrl, {
        scheme_id: scheme?.id,
        form_data: values,
        current_step: activeStep,
      });
      toastRef.current?.show({
        severity: "success",
        summary: "Draft Saved",
        detail: "Your progress has been saved.",
        life: 2000,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Failed to save draft",
        life: 3000,
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate(formSections, fieldMaster);

    if (!isValid) {
      toastRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fix all errors before submitting.",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.post(submitUrl, {
        scheme_id: scheme?.id,
        form_data: values,
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Application submitted successfully!",
        life: 3000,
      });

      setTimeout(() => {
        router.push("/investor/applications");
      }, 2000);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          err.message ||
          "Failed to submit application",
        life: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading || fieldsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <ProgressSpinner />
      </div>
    );
  }

  // Error
  if (error || !scheme) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Scheme Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            {error || "The requested scheme could not be found."}
          </p>
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }

  // No form structure
  if (formSections.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-file-edit text-blue-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Form Not Configured
          </h2>
          <p className="text-gray-500 mb-4">
            The application form for this scheme has not been configured yet.
          </p>
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }

  const isLastStep = activeStep === formSections.length - 1;
  const isFirstStep = activeStep === 0;

  return (
    <div className="p-6">
      <Toast ref={toastRef} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {scheme.scheme_name}
        </h1>
      </div>

      {/* Progress Steps - Only show in multi-step mode with multiple steps */}
      {isMultiStep && totalSteps > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            {stepGroups.map((group, index: number) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < activeStep
                        ? "bg-green-500 text-white"
                        : index === activeStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < activeStep ? (
                      <i className="pi pi-check text-xs"></i>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm hidden md:block ${
                      index === activeStep
                        ? "font-medium text-gray-800"
                        : "text-gray-500"
                    }`}
                  >
                    {group.sections[0]?.section_title ||
                      `Step ${group.stepNumber}`}
                  </span>
                </div>
                {index < stepGroups.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < activeStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Render based on mode */}
        {isMultiStep ? (
          /* Multi-Step Mode: Show sections in current step */
          currentStepSections.length > 0 && (
            <DynamicFormRenderer
              formStructure={currentStepSections}
              fieldMaster={fieldMaster}
              values={values}
              onChange={handleChange}
              errors={errors}
            />
          )
        ) : (
          /* Single-Page Mode: Show all sections */
          <DynamicFormRenderer
            formStructure={formSections}
            fieldMaster={fieldMaster}
            values={values}
            onChange={handleChange}
            errors={errors}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
          {/* Previous button - only in multi-step mode */}
          {isMultiStep ? (
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              className="p-button-outlined p-button-secondary"
              type="button"
              disabled={isFirstStep}
              onClick={handlePrevious}
            />
          ) : (
            <div></div>
          )}

          <div className="flex gap-3">
            <Button
              label="Save Draft"
              icon="pi pi-save"
              className="p-button-outlined"
              type="button"
              loading={savingDraft}
              onClick={handleSaveDraft}
            />

            {/* In multi-step: Show Next or Submit based on step; In single-page: Always show Submit */}
            {isMultiStep && !isLastStep ? (
              <Button
                label="Next"
                icon="pi pi-chevron-right"
                iconPos="right"
                type="button"
                onClick={handleNext}
              />
            ) : (
              <Button
                label="Submit Application"
                icon="pi pi-check"
                className="p-button-success"
                type="submit"
                loading={submitting}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
