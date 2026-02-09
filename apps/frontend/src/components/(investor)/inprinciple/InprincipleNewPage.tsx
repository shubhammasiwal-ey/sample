'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DynamicForm, DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import { useMasterOptions, useNicCodes, useHsnCodes } from '@/hooks/investor/inprinciple/useMasterOptions';
import { useInprincipleDocuments } from '@/hooks/investor/inprinciple/useInprincipleDocuments';
import { useServiceSectors } from '@/hooks/master/useServicesectors';
import { usePollutionCategories } from '@/hooks/master/usePollutionCategories';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { buildCompanyDetailsStep } from '@/components/(investor)/inprinciple/steps/CompanyDetails';
import { buildAuthorisedSignatoryPromoterDetailsStep } from '@/components/(investor)/inprinciple/steps/AuthorisedSignatoryPromoterDetails';
import { buildProposedProjectDetailsStep } from '@/components/(investor)/inprinciple/steps/ProposedProjectDetails';
import { buildProjectFinanceStep } from '@/components/(investor)/inprinciple/steps/ProjectFinance';
import { buildProjectRequirementStep } from '@/components/(investor)/inprinciple/steps/ProjectRequirement';
import { buildSupportingDocumentsStep } from '@/components/(investor)/inprinciple/steps/SupportingDocuments';
import { buildPaymentStep } from '@/components/(investor)/inprinciple/steps/Payment';
import { buildApplicationSigningStep } from '@/components/(investor)/inprinciple/steps/ApplicationSigning';
import { buildSummaryStep } from '@/components/(investor)/inprinciple/steps/Summary';

type UploadedFileInfo = {
  filePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export default function InprincipleNewProjectPage() {
  const { user, loading, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [promoters, setPromoters] = useState<any[]>([]);
  const [waterDetails, setWaterDetails] = useState<any[]>([]);
  const [electricityDetails, setElectricityDetails] = useState<any[]>([]);
  const [capacityItems, setCapacityItems] = useState<any[]>([]);
  const [productItems, setProductItems] = useState<any[]>([]);
  const [formUploads, setFormUploads] = useState<Record<string, UploadedFileInfo>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, any>>({});
  const [documentsAppStatus, setDocumentsAppStatus] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalDoc, setUploadModalDoc] = useState<any | null>(null);
  const [uploadForm, setUploadForm] = useState({
    uploadType: 'new' as 'new' | 'duplicate',
    comments: '',
    validFrom: '',
    validTo: '',
    docDateOfIssuance: '',
    isDocumentActive: 'Y',
    file: null as File | null,
  });
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileInputResetKey, setFileInputResetKey] = useState(0);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, any> | null>(null);
  const [draftLoadedId, setDraftLoadedId] = useState<number | null>(null);
  const [initialStep, setInitialStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [authModalTitle, setAuthModalTitle] = useState('Session Message');
  const [shouldLogout, setShouldLogout] = useState(false);
  const lastDraftStepRef = useRef<number | null>(null);
  const formStepsRef = useRef<any[]>([]);
  const formMethodsRef = useRef<any>(null);

  const [corpCountryId, setCorpCountryId] = useState<string | number>();
  const [corpStateId, setCorpStateId] = useState<string | number>();
  const [corpDistrictId, setCorpDistrictId] = useState<string | number>();

  const [corrCountryId, setCorrCountryId] = useState<string | number>();
  const [corrStateId, setCorrStateId] = useState<string | number>();
  const [corrDistrictId, setCorrDistrictId] = useState<string | number>();

  const [projectDistrictId, setProjectDistrictId] = useState<string | number>();
  const [projectTehsilId, setProjectTehsilId] = useState<string | number>();

  const { data: countries } = useMasterOptions('COUNTRY');
  const { data: corpStates } = useMasterOptions('STATE', corpCountryId, !!corpCountryId);
  const { data: corpDistricts } = useMasterOptions('DISTRICT', corpStateId, !!corpStateId);
  const { data: corpTehsils } = useMasterOptions('BLOCK', corpDistrictId, !!corpDistrictId);

  const { data: corrStates } = useMasterOptions('STATE', corrCountryId, !!corrCountryId);
  const { data: corrDistricts } = useMasterOptions('DISTRICT', corrStateId, !!corrStateId);
  const { data: corrTehsils } = useMasterOptions('BLOCK', corrDistrictId, !!corrDistrictId);

  const indiaCountryId = useMemo(
    () => countries?.find((item) => item.label?.toLowerCase() === 'india')?.value,
    [countries]
  );
  const { data: ukStates } = useMasterOptions('STATE', indiaCountryId, !!indiaCountryId);
  const uttarakhandStateId = useMemo(
    () => ukStates?.find((item) => item.label?.toLowerCase() === 'uttarakhand')?.value,
    [ukStates]
  );
  const { data: projectDistricts } = useMasterOptions('DISTRICT', uttarakhandStateId, !!uttarakhandStateId);
  const { data: projectTehsils } = useMasterOptions('BLOCK', projectDistrictId, !!projectDistrictId);
  const { data: projectVillages } = useMasterOptions('VILLAGE', projectTehsilId, !!projectTehsilId);

  const { data: nicCodes } = useNicCodes();
  const { data: hsnCodes } = useHsnCodes();
  const [filteredNicCodes, setFilteredNicCodes] = useState<{ value: string | number; label: string }[]>([]);
  const [filteredHsnCodes, setFilteredHsnCodes] = useState<{ value: string | number; label: string }[]>([]);
  const { data: sectorsRaw } = useServiceSectors({ isActive: true });
  const { data: pollutionCategories = [] } = usePollutionCategories({ isActive: true });

  const sectorOptions = useMemo(
    () => (sectorsRaw || []).map((item: { id: number; name: string }) => ({ value: item.id, label: item.name })),
    [sectorsRaw]
  );

  const pollutionActivityOptions = useMemo(
    () =>
      (pollutionCategories || []).map((item) => ({
        value: item.id,
        label: item.activityName,
        category: item.category,
      })),
    [pollutionCategories]
  );

  const yesNoOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ];

  const landRequirementOptions = [
    { label: 'Land', value: 'land' },
    { label: 'Built Up Space (IT/ITES)', value: 'built_up_space_it_ites' },
  ];

  const landOwnershipOptions = [
    { label: 'Owned Land Inside Notified Industrial Estate', value: 'owned_inside_notified' },
    { label: 'Owned Land Outside Notified Industrial Estate', value: 'owned_outside_notified' },
    { label: 'Private land on Rent / Lease', value: 'private_rent_lease' },
    { label: 'SIIDCUL Land On Lease', value: 'siidcul_lease' },
    { label: 'Mini Industrial Area & Industrial Area (of DIC)', value: 'mini_industrial_area_dic' },
  ];

  const landUseOptions = [
    { label: 'Industrial', value: 'industrial' },
    { label: 'Agriculture', value: 'agriculture' },
    { label: 'Commercial', value: 'commercial' },
    { label: 'Institutional', value: 'institutional' },
  ];

  const electricitySourceOptions = [
    { label: 'Captive Power Unit', value: 'captive_power_unit' },
    { label: 'DG Set', value: 'dg_set' },
    { label: 'Solar Power', value: 'solar_power' },
    { label: 'Power Corporation', value: 'power_corporation' },
  ];

  const waterSourceOptions = [
    { label: 'Drawing from Borewell', value: 'drawing_from_borewell' },
    { label: 'Drawing from river / canal', value: 'drawing_from_river_canal' },
    { label: 'SIIDCUL water connection', value: 'siidcul_water_connection' },
    { label: 'Jal Sansthan water connection', value: 'jal_sansthan_water_connection' },
  ];

  const developmentAuthorityOptions = [
    { label: 'Mussoorie Dehradun Development Authority (MDDA)', value: 'mdda' },
    { label: 'Haridwar Roorkee Development Authority (HRDA)', value: 'hrda' },
    { label: 'Haldwani Kathgodam Development Authority (HKDA)', value: 'hkda' },
    { label: 'Nainital Lake Development Authority (NLDA)', value: 'nlda' },
    { label: 'Rishikesh Development Authority (RDA)', value: 'rda' },
  ];

  const casteOptions = [
    { label: 'General', value: 'general' },
    { label: 'SC', value: 'sc' },
    { label: 'ST', value: 'st' },
    { label: 'OBC', value: 'obc' },
  ];

  const industrialAreaOptions: { label: string; value: string }[] = [];
  const siidculEstateOptions: { label: string; value: string }[] = [];
  const msmeEstateOptions: { label: string; value: string }[] = [];

  const toTitleCase = (text: string) =>
    text
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatOptions = (options?: { value: string | number; label: string }[]) =>
    (options || []).map((item) => ({
      ...item,
      label: item.label ? toTitleCase(item.label) : item.label,
    }));

  const corpDistrictOptions = useMemo(() => formatOptions(corpDistricts as any), [corpDistricts]);
  const corpTehsilOptions = useMemo(() => formatOptions(corpTehsils as any), [corpTehsils]);
  const corrDistrictOptions = useMemo(() => formatOptions(corrDistricts as any), [corrDistricts]);
  const corrTehsilOptions = useMemo(() => formatOptions(corrTehsils as any), [corrTehsils]);
  const projectDistrictOptions = useMemo(
    () => formatOptions(projectDistricts as any),
    [projectDistricts]
  );
  const projectTehsilOptions = useMemo(() => formatOptions(projectTehsils as any), [projectTehsils]);

  useEffect(() => {
    setFilteredNicCodes([...(nicCodes || [])] as { value: string | number; label: string }[]);
  }, [nicCodes]);

  useEffect(() => {
    setFilteredHsnCodes([...(hsnCodes || [])] as { value: string | number; label: string }[]);
  }, [hsnCodes]);

  const proposalParam = (searchParams?.get('proposal') || '').toLowerCase();
  const serviceId = searchParams?.get('serviceId') || '943.0';
  const departmentId = searchParams?.get('departmentId') || '';
  const submissionIdParam = searchParams?.get('submissionId');
  const modeParam = searchParams?.get('mode');

  const proposalTypeByServiceId: Record<string, string> = {
    '943.0': 'new',
  };

  const decodeParam = (value?: string | null) => {
    if (!value) return '';
    return value;
  };

  const encodeParam = (value: string | number) => String(value);

  useEffect(() => {
    const decodedSubmissionId = decodeParam(submissionIdParam);
    const parsedId = Number(decodedSubmissionId);
    if (Number.isFinite(parsedId) && parsedId > 0) {
      setSubmissionId(parsedId);
    }
  }, [submissionIdParam]);

  useEffect(() => {
    decodeParam(modeParam);
  }, [modeParam]);

  const proposalType = useMemo(() => {
    if (serviceId && proposalTypeByServiceId[serviceId]) {
      return proposalTypeByServiceId[serviceId];
    }
    switch (proposalParam) {
      case 'extension':
      case 'modernisation':
      case 'diversification':
      case 'amendment':
      case 'expansion':
        return proposalParam;
      default:
        return 'new';
    }
  }, [proposalParam, serviceId]);
  const companyName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';

  const { data: inprincipleDocuments = [] } = useInprincipleDocuments(serviceId);

  const allowedDocumentStatuses = useMemo(() => ['I', 'RBI', 'H', 'DP', 'PD'], []);
  const canUploadDocuments = useMemo(
    () => !documentsAppStatus || allowedDocumentStatuses.includes(documentsAppStatus),
    [documentsAppStatus, allowedDocumentStatuses]
  );

  useEffect(() => {
    if (!submissionId) return;
    const fetchUploads = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/documents/uploads', {
          params: { submissionId },
        });
        const uploads = res?.data?.uploads || [];
        const map: Record<string, any> = {};
        uploads.forEach((item: any) => {
          if (item.documentMasterId) {
            map[String(item.documentMasterId)] = item;
          }
        });
        setUploadedDocuments(map);
        setDocumentsAppStatus(res?.data?.appStatus || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUploads();
  }, [submissionId]);

  const defaultValues = useMemo(
    () => ({
      company: {
        proposal_type: proposalType,
        name: companyName,
        corr_same_as_corp: true,
      },
    }),
    [proposalType, companyName]
  );

  const mergeDeep = (base: any, override: any) => {
    if (Array.isArray(base) || Array.isArray(override)) {
      return override ?? base;
    }
    if (base && typeof base === 'object' && override && typeof override === 'object') {
      const result: Record<string, any> = { ...base };
      Object.keys(override).forEach((key) => {
        result[key] = mergeDeep(base?.[key], override[key]);
      });
      return result;
    }
    return override ?? base;
  };

  const formDefaults = useMemo(
    () => mergeDeep(defaultValues, draftValues || {}),
    [defaultValues, draftValues]
  );

  const autoSelectRef = useRef({ corp: false, corr: false });
  const draftAddressRef = useRef<{ corp?: any; corr?: any }>({});

  useEffect(() => {
    if (!draftValues || !formMethodsRef.current) return;
    const methods = formMethodsRef.current;
    const corp = draftValues?.company?.corp || {};
    const corr = draftValues?.company?.corr || {};
    draftAddressRef.current = { corp, corr };
    autoSelectRef.current = { corp: false, corr: false };

    if (corp.country) {
      methods.setValue('company.corp.country', corp.country);
    }

    if (corr.country) {
      methods.setValue('company.corr.country', corr.country);
    }
  }, [draftValues, corpStates, corpDistricts, corpTehsils, corrStates, corrDistricts, corrTehsils]);

  useEffect(() => {
    const methods = formMethodsRef.current;
    if (!methods) return;
    const corp = draftAddressRef.current.corp || {};
    if (!autoSelectRef.current.corp && corp.country && corpStates) {
      if (corp.state) methods.setValue('company.corp.state', corp.state);
      if (corp.district) methods.setValue('company.corp.district', corp.district);
      if (corp.block) methods.setValue('company.corp.block', corp.block);
      autoSelectRef.current.corp = true;
    }
  }, [corpStates, corpDistricts, corpTehsils]);

  useEffect(() => {
    const methods = formMethodsRef.current;
    if (!methods) return;
    const corr = draftAddressRef.current.corr || {};
    if (!autoSelectRef.current.corr && corr.country && corrStates) {
      if (corr.state) methods.setValue('company.corr.state', corr.state);
      if (corr.district) methods.setValue('company.corr.district', corr.district);
      if (corr.block) methods.setValue('company.corr.block', corr.block);
      autoSelectRef.current.corr = true;
    }
  }, [corrStates, corrDistricts, corrTehsils]);

  useEffect(() => {
    const decodedSubmissionId = decodeParam(submissionIdParam);
    const parsedId = Number(decodedSubmissionId);
    const mode = decodeParam(modeParam);
    if (!parsedId || mode !== 'edit' || draftLoadedId === parsedId) return;

    const loadDraft = async () => {
      setDraftLoading(true);
      try {
        const res = await apiClient.get('/investor/inprinciple/draft', {
          params: { submissionId: parsedId },
        });
        const formData = res?.data?.formData || {};
        setDraftValues(formData);
        setDraftLoadedId(parsedId);
        const savedStep = Number(formData?.__currentStep ?? -1);

        const documents = formData?.documents || {};
        const loadedUploads: Record<string, UploadedFileInfo> = {};
        Object.entries(documents).forEach(([docKey, filePath]) => {
          if (!filePath || typeof filePath !== 'string') return;
          const fileName = filePath.split('/').pop() || 'document';
          loadedUploads[docKey] = {
            filePath,
            fileName,
            originalName: fileName,
            mimeType: '',
            size: 0,
          };
        });
        if (Object.keys(loadedUploads).length) {
          setFormUploads(loadedUploads);
        }

        const corp = formData?.company?.corp || {};
        const corr = formData?.company?.corr || {};
        const land = formData?.requirement?.land || {};
        const draftPromoters =
          formData?.promoter?.entries ||
          formData?.promoter_entries ||
          formData?.promoters ||
          formData?.promoterDetails ||
          [];
        const draftWaterDetails = formData?.requirement?.water?.details || [];
        const draftPowerDetails = formData?.requirement?.power?.details || [];
        const draftCapacityItems = formData?.project?.capacity_items || [];
        const draftProductItems = formData?.project?.product_items || [];

        if (corp.country) setCorpCountryId(corp.country);
        if (corp.state) setCorpStateId(corp.state);
        if (corp.district) setCorpDistrictId(corp.district);

        if (corr.country) setCorrCountryId(corr.country);
        if (corr.state) setCorrStateId(corr.state);
        if (corr.district) setCorrDistrictId(corr.district);

        if (land.district) setProjectDistrictId(land.district);
        if (land.block) setProjectTehsilId(land.block);

        const stepsForCompute = formStepsRef.current.length ? formStepsRef.current : formConfig.steps;
        const { completed, nextStep } = computeCompletedSteps(
          formData,
          stepsForCompute,
          savedStep,
          true
        );
        updateCompletionState(completed, nextStep);

        if (Array.isArray(draftPromoters)) {
          setPromoters(draftPromoters);
          formMethodsRef.current?.setValue?.('promoter.entries', draftPromoters);
        }
        if (Array.isArray(draftWaterDetails)) {
          setWaterDetails(draftWaterDetails);
          formMethodsRef.current?.setValue?.('requirement.water.details', draftWaterDetails);
        }
        if (Array.isArray(draftPowerDetails)) {
          setElectricityDetails(draftPowerDetails);
          formMethodsRef.current?.setValue?.('requirement.power.details', draftPowerDetails);
        }
        if (Array.isArray(draftCapacityItems)) {
          setCapacityItems(draftCapacityItems);
          formMethodsRef.current?.setValue?.('project.capacity_items', draftCapacityItems);
        }
        if (Array.isArray(draftProductItems)) {
          setProductItems(draftProductItems);
          formMethodsRef.current?.setValue?.('project.product_items', draftProductItems);
        }
      } catch (error) {
        console.error('Failed to load draft application', error);
        setAuthModalTitle('Load Draft Failed');
        setAuthModalMessage('Unable to load draft data. Please try again.');
        setShowAuthModal(true);
        setShouldLogout(false);
      } finally {
        setDraftLoading(false);
      }
    };

    loadDraft();
  }, [submissionIdParam, modeParam, draftLoadedId]);

  const getProcessingLevel = (data: any) => {
    const rawValue = data?.finance?.cost?.plant;
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      return 'District';
    }
    return numericValue > 50 ? 'State' : 'District';
  };

  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
  const digitsPattern = /^\d+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const aadhaarPattern = /^\d{12}$/;

  const validateOptionalDigits = (min: number, max: number, label: string) => (value: string) => {
    if (!value) return true;
    if (!digitsPattern.test(value)) return `${label} should contain digits only`;
    if (value.length < min) return `${label} must be at least ${min} digits`;
    if (value.length > max) return `${label} must be at most ${max} digits`;
    return true;
  };

  const validateOptionalEmail = (value: string) => {
    if (!value) return true;
    return emailPattern.test(value) || 'Please enter a valid email';
  };

  const getValueByPath = (data: any, path: string) =>
    path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), data);

  const isFilledValue = (value: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'boolean') return value === true;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const isDependsOnVisible = (field: any, values: any) => {
    if (!field.dependsOn) return true;
    const watchedValue = getValueByPath(values, field.dependsOn.field);
    const targetValues = Array.isArray(field.dependsOn.value)
      ? field.dependsOn.value
      : [field.dependsOn.value];
    const conditionMet = targetValues.includes(watchedValue);
    return field.dependsOn.show ? conditionMet : !conditionMet;
  };

  const computeCompletedSteps = (
    values: any,
    steps: any[],
    savedStep?: number,
    forceFromSavedStep?: boolean,
  ) => {
    const extraRequiredByStep: Record<number, string[]> = {
      0: ['company.corp.country_code', 'company.corp.mobile'],
    };

    const completed: number[] = [];
    const savedStepCount = Number.isFinite(savedStep) ? Number(savedStep) : 0;
    const normalizedSavedStep = savedStepCount > 0 ? savedStepCount - 1 : -1;

    if (forceFromSavedStep && savedStepCount > 0) {
      const maxStep = Math.min(savedStepCount - 1, steps.length - 1);
      for (let i = 0; i <= maxStep; i += 1) {
        completed.push(i);
      }
    }

    steps.forEach((step, index) => {
      if (completed.includes(index)) {
        return;
      }
      const requiredFields = step.sections.flatMap((section: any) =>
        section.fields.filter((field: any) => field?.validation?.required)
      );
      const requiredPaths = requiredFields
        .filter((field: any) => isDependsOnVisible(field, values))
        .map((field: any) => field.name);
      const extraPaths = extraRequiredByStep[index] || [];
      const allPaths = [...requiredPaths, ...extraPaths];
      const hasRequired = allPaths.length > 0;
      const isStepComplete = hasRequired
        ? allPaths.every((path) => isFilledValue(getValueByPath(values, path)))
        : step.sections.some((section: any) =>
          section.fields.some((field: any) => {
            if (!field?.name || field.type === 'custom') return false;
            if (!isDependsOnVisible(field, values)) return false;
            return isFilledValue(getValueByPath(values, field.name));
          })
        );
      let meetsRowRequirement = true;
      if (step.title === 'Authorised Signatory & Promoter Details') {
        const entries = values?.promoter?.entries || [];
        meetsRowRequirement = Array.isArray(entries) && entries.length > 0;
      }
      if (step.title === 'Proposed Project Details') {
        const capacityItems = values?.project?.capacity_items || [];
        const productItems = values?.project?.product_items || [];
        meetsRowRequirement =
          Array.isArray(capacityItems) &&
          capacityItems.length > 0 &&
          Array.isArray(productItems) &&
          productItems.length > 0;
      }
      if (step.title === 'Supporting Documents') {
        const requiredDocs = inprincipleDocuments.filter((doc: any) => doc?.isRequired === 'Y');
        if (requiredDocs.length) {
          meetsRowRequirement = requiredDocs.every((doc: any) => {
            const uploaded = uploadedDocuments[String(doc.id)];
            return !!uploaded?.filePath;
          });
        }
      }

      if (isStepComplete && meetsRowRequirement) {
        completed.push(index);
      }
    });

    const supportingIndex = steps.findIndex((step) => step.title === 'Supporting Documents');
    if (supportingIndex !== -1) {
      const requiredDocs = inprincipleDocuments.filter((doc: any) => doc?.isRequired === 'Y');
      const allRequiredUploaded =
        requiredDocs.length === 0
          ? true
          : requiredDocs.every((doc: any) => {
            const uploaded = uploadedDocuments[String(doc.id)];
            return !!uploaded?.filePath;
          });
      if (!allRequiredUploaded) {
        const nextCompleted = completed.filter((idx) => idx !== supportingIndex);
        completed.length = 0;
        completed.push(...nextCompleted);
      }
    }

    const fallbackNext = completed.length ? Math.min(completed.length, steps.length - 1) : 0;
    const nextStep =
      savedStepCount > 0
        ? Math.min(savedStepCount, steps.length - 1)
        : fallbackNext;
    return { completed, nextStep };
  };

  const areStepArraysEqual = (a: number[], b: number[]) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const updateCompletionState = (completed: number[], nextStep: number, updateInitial = true) => {
    setCompletedSteps((prev) => (areStepArraysEqual(prev, completed) ? prev : completed));
    if (updateInitial) {
      setInitialStep((prev) => (prev === nextStep ? prev : nextStep));
    }
  };

  const markCompletedThroughStep = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const prevMax = prev.length ? Math.max(...prev) : -1;
      const maxStep = Math.max(prevMax, stepIndex, 0);
      const completed = Array.from({ length: maxStep + 1 }, (_, i) => i);
      return areStepArraysEqual(prev, completed) ? prev : completed;
    });
  };

  const getMergedDraftData = (data: any, stepIndex: number) => {
    const merged = mergeDeep(draftValues || {}, data || {});
    const prevStepCount = Number(merged?.__currentStep ?? 0);
    const latestStepCount = Math.max(prevStepCount, stepIndex + 1, 0);

    const safePromoters =
      (Array.isArray(merged?.promoter?.entries) && merged.promoter.entries) ||
      (Array.isArray(data?.promoter?.entries) && data.promoter.entries) ||
      promoters;
    const safeWaterDetails =
      (Array.isArray(merged?.requirement?.water?.details) && merged.requirement.water.details) ||
      (Array.isArray(data?.requirement?.water?.details) && data.requirement.water.details) ||
      waterDetails;
    const safePowerDetails =
      (Array.isArray(merged?.requirement?.power?.details) && merged.requirement.power.details) ||
      (Array.isArray(data?.requirement?.power?.details) && data.requirement.power.details) ||
      electricityDetails;
    const safeCapacityItems =
      (Array.isArray(merged?.project?.capacity_items) && merged.project.capacity_items) ||
      (Array.isArray(data?.project?.capacity_items) && data.project.capacity_items) ||
      capacityItems;
    const safeProductItems =
      (Array.isArray(merged?.project?.product_items) && merged.project.product_items) ||
      (Array.isArray(data?.project?.product_items) && data.project.product_items) ||
      productItems;

    const nextMerged = {
      ...merged,
      promoter: {
        ...(merged?.promoter || {}),
        entries: safePromoters || [],
      },
      requirement: {
        ...(merged?.requirement || {}),
        water: {
          ...(merged?.requirement?.water || {}),
          details: safeWaterDetails || [],
        },
        power: {
          ...(merged?.requirement?.power || {}),
          details: safePowerDetails || [],
        },
      },
      project: {
        ...(merged?.project || {}),
        capacity_items: safeCapacityItems || [],
        product_items: safeProductItems || [],
      },
      __currentStep: latestStepCount,
    };

    const hasValues = (value: any) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'object') return Object.values(value).some(hasValues);
      return true;
    };

    const shouldKeepProject = hasValues(draftValues?.project);
    if (!shouldKeepProject && stepIndex < 2 && !hasValues(nextMerged.project)) {
      delete (nextMerged as any).project;
    }

    const shouldKeepPromoter = hasValues(draftValues?.promoter);
    if (!shouldKeepPromoter && stepIndex < 1 && !hasValues(nextMerged.promoter)) {
      delete (nextMerged as any).promoter;
    }

    const shouldKeepAuthorized = hasValues(draftValues?.authorized);
    if (!shouldKeepAuthorized && stepIndex < 1 && !hasValues(nextMerged.authorized)) {
      delete (nextMerged as any).authorized;
    }

    const shouldKeepRequirement = hasValues(draftValues?.requirement);
    if (!shouldKeepRequirement && stepIndex < 4 && !hasValues(nextMerged.requirement)) {
      delete (nextMerged as any).requirement;
    }

    const shouldKeepFinance = hasValues(draftValues?.finance);
    if (!shouldKeepFinance && stepIndex < 3 && !hasValues(nextMerged.finance)) {
      delete (nextMerged as any).finance;
    }

    const shouldKeepDocuments = hasValues(draftValues?.documents);
    if (!shouldKeepDocuments && stepIndex < 5 && !hasValues(nextMerged.documents)) {
      delete (nextMerged as any).documents;
    }

    const shouldKeepPayment = hasValues(draftValues?.payment);
    if (!shouldKeepPayment && stepIndex < 6 && !hasValues(nextMerged.payment)) {
      delete (nextMerged as any).payment;
    }

    const shouldKeepSigning = hasValues(draftValues?.signing);
    if (!shouldKeepSigning && stepIndex < 7 && !hasValues(nextMerged.signing)) {
      delete (nextMerged as any).signing;
    }

    const shouldKeepSummary = hasValues(draftValues?.summary);
    if (!shouldKeepSummary && stepIndex < 8 && !hasValues(nextMerged.summary)) {
      delete (nextMerged as any).summary;
    }

    return nextMerged;
  };

  const saveDraft = async (data: any, stepIndex: number) => {
    if (loading || !user?.id) {
      console.warn('Draft save skipped: user not authenticated yet.');
      setAuthModalTitle('Session Expired');
      setAuthModalMessage('Session expired. Please login again.');
      setShowAuthModal(true);
      setShouldLogout(true);
      return false;
    }
    if (savingDraft) return false;
    if (lastDraftStepRef.current === stepIndex) return true;

    const mergedData = getMergedDraftData(data, stepIndex);
    const districtId = Number(
      mergedData?.requirement?.land?.district || mergedData?.company?.corp?.district || 0
    );
    const unitName = mergedData?.company?.name || '';
    const processingLevel = getProcessingLevel(mergedData);

    setSavingDraft(true);
    try {
      const payload = {
        submissionId,
        serviceId,
        departmentId: departmentId ? Number(departmentId) : undefined,
        formTypeId: 1,
        processingLevel,
        formData: mergedData,
        unitName,
        districtId,
        cafType: proposalType,
        currentStep: stepIndex,
      };

      const response = submissionId
        ? await apiClient.post('/investor/inprinciple/update', payload)
        : await apiClient.post('/investor/inprinciple/submit', payload);

      const nextSubmissionId =
        response?.data?.submissionId ||
        response?.data?.submission_id ||
        response?.data?.id ||
        submissionId;

      if (!submissionId && nextSubmissionId) {
        setSubmissionId(Number(nextSubmissionId));
      } else if (!submissionId && !nextSubmissionId) {
        setAuthModalMessage('Draft save failed. Please try again.');
        setShowAuthModal(true);
        setShouldLogout(false);
        return false;
      }
      if (!submissionId && nextSubmissionId) {
        const encodedSubmission = encodeParam(nextSubmissionId);
        const encodedMode = encodeParam('edit');
        const encodedService = encodeParam(serviceId);
        const encodedDept = departmentId ? encodeParam(departmentId) : '';
        const params = new URLSearchParams();
        params.set('submissionId', encodedSubmission);
        params.set('mode', encodedMode);
        if (encodedService) params.set('serviceId', encodedService);
        if (encodedDept) params.set('departmentId', encodedDept);
        router.replace(`/investor/inprinciple/new?${params.toString()}`);
      }
      setDraftValues(mergedData);
      lastDraftStepRef.current = stepIndex;
      return true;
    } catch (error: any) {
      const errorData = error?.response?.data;
      const extractMessage = () => {
        if (!errorData) return 'Draft save failed. Please try again.';
        if (typeof errorData === 'string') return errorData;
        if (Array.isArray(errorData?.message)) return errorData.message.join(', ');
        if (errorData?.message) return String(errorData.message);
        if (errorData?.detail) return String(errorData.detail);
        if (errorData?.error) return String(errorData.error);
        return 'Draft save failed. Please try again.';
      };

      if (error?.response?.status === 401) {
        console.error('Draft save failed: unauthorized.', error?.response?.data);
        setAuthModalTitle('Unauthorized');
        setAuthModalMessage(extractMessage());
        setShowAuthModal(true);
        setShouldLogout(false);
        return false;
      }
      console.error('Draft save failed', error);
      setAuthModalTitle('Draft Save Failed');
      setAuthModalMessage(extractMessage());
      setShowAuthModal(true);
      setShouldLogout(false);
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const formatTextValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-';
    const text = String(value);
    if (text.includes('@')) return text;
    const normalized = text.replace(/_/g, ' ').trim();
    if (!normalized) return '-';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getFileKind = (file?: UploadedFileInfo | null) => {
    if (!file) return 'unknown';
    const mime = file.mimeType?.toLowerCase() || '';
    const name = file.originalName?.toLowerCase() || '';
    if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (mime.startsWith('image/') || name.match(/\.(png|jpe?g)$/)) return 'image';
    return 'file';
  };

  const getFileUrl = (file: UploadedFileInfo) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (file.filePath.startsWith('http://') || file.filePath.startsWith('https://')) {
      return file.filePath;
    }
    if (!baseUrl) {
      return file.filePath;
    }
    return `${baseUrl}${file.filePath.startsWith('/') ? '' : '/'}${file.filePath}`;
  };

  const renderBooleanIcon = (value: unknown) => {
    const isTrue = value === true || value === 'yes' || value === 'true';
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}
      >
        <i className={`pi ${isTrue ? 'pi-check' : 'pi-times'}`} />
      </span>
    );
  };

  const uploadInprincipleFile = async (fieldName: string, file: File, methods: any) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5 MB.');
      return;
    }
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await apiClient.post('/investor/inprinciple/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded: UploadedFileInfo = {
        filePath: res.data.filePath,
        fileName: res.data.fileName || file.name,
        originalName: res.data.originalName || file.name,
        mimeType: res.data.mimeType || file.type,
        size: res.data.size || file.size,
      };

      setFormUploads((prev) => ({ ...prev, [fieldName]: uploaded }));
      methods.setValue(fieldName, uploaded.filePath);
    } catch (error) {
      console.error(error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderFileCell = (file: UploadedFileInfo | null | undefined, label: string) => {
    if (!file) return <span className="text-gray-400">-</span>;
    const kind = getFileKind(file);
    const iconClass =
      kind === 'pdf' ? 'pi pi-file-pdf text-red-600' : 'pi pi-image text-blue-600';
    return (
      <a
        href={getFileUrl(file)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <i className={iconClass} />
        <span className="text-xs">Open</span>
      </a>
    );
  };

  const renderUploadField =
    (fieldName: string, label: string, accept: string, requiredMessage?: string) =>
      (methods: any) => {
        const currentPath = methods.watch(fieldName);
        const uploaded = formUploads[fieldName];
        const fileInfo: UploadedFileInfo | null =
          uploaded ||
          (currentPath
            ? {
              filePath: currentPath,
              fileName: currentPath.split('/').pop() || 'document',
              originalName: currentPath.split('/').pop() || 'document',
              mimeType: '',
              size: 0,
            }
            : null);

        return (
          <div className="mb-2.5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
              {requiredMessage && <span className="text-red-600 ml-1">*</span>}
            </label>
            {requiredMessage && (
              <input type="hidden" {...methods.register(fieldName, { required: requiredMessage })} />
            )}
            <input
              type="file"
              accept={accept}
              key={`${fieldName}-${fileInputResetKey}`}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadInprincipleFile(fieldName, file, methods);
                }
              }}
            />
            {fileInfo && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                {renderFileCell(fileInfo, label)}
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">Replace</span>
              </div>
            )}
          </div>
        );
      };

  const openUploadModal = (doc: any) => {
    setUploadModalDoc(doc);
    setUploadError('');
    setUploadForm({
      uploadType: doc?.isMultiVersionAllowed === false ? 'new' : 'new',
      comments: '',
      validFrom: '',
      validTo: '',
      docDateOfIssuance: '',
      isDocumentActive: 'Y',
      file: null,
    });
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setUploadModalDoc(null);
    setUploadError('');
  };

  const submitUpload = async (doc: any) => {
    if (!submissionId) {
      setUploadError('Submission ID not found.');
      return;
    }
    if (!doc?.id) {
      setUploadError('Document not found.');
      return;
    }
    if (!uploadForm.file) {
      setUploadError('Please select a file.');
      return;
    }
    try {
      setUploading(true);
      setUploadError('');
      const form = new FormData();
      form.append('file', uploadForm.file);
      form.append('submissionId', String(submissionId));
      form.append('documentMasterId', String(doc.id));
      form.append('uploadType', uploadForm.uploadType);
      form.append('comments', uploadForm.comments || '');
      form.append('validFrom', uploadForm.validFrom || '');
      form.append('validTo', uploadForm.validTo || '');
      form.append('docDateOfIssuance', uploadForm.docDateOfIssuance || '');
      form.append('isDocumentActive', uploadForm.isDocumentActive || 'Y');

      const res = await apiClient.post('/investor/inprinciple/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.success === false) {
        setUploadError(res?.data?.message || 'Upload failed.');
        return;
      }

      const uploaded = res?.data?.data;
      if (uploaded?.documentsId) {
        setUploadedDocuments((prev) => ({ ...prev, [String(doc.id)]: uploaded }));
      }
      closeUploadModal();
    } catch (error: any) {
      setUploadError(error?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const getFieldError = (methods: any, name: string) => {
    const parts = name.split('.');
    let current = methods?.formState?.errors;
    for (const part of parts) {
      current = current?.[part];
    }
    return current?.message as string | undefined;
  };

  const conditionalRequired =
    (fieldPath: string, expectedValue: string, message: string) => (value: any) => {
      const current = formMethodsRef.current?.getValues?.(fieldPath);
      if (current === expectedValue) {
        if (value === null || value === undefined || String(value).trim() === '') {
          return message;
        }
      }
      return true;
    };

  const computeFinanceDerived = (methods: any) => {
    if (!methods) return;
    const cost = methods.getValues('finance.cost') || {};
    const sum = ['land', 'building', 'plant', 'working_capital', 'contingency', 'others']
      .map((key) => parseFloat(cost?.[key] || 0))
      .reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
    const total = Number.isFinite(sum) ? sum.toString() : '';
    if (methods.getValues('finance.cost.total') !== total) {
      methods.setValue('finance.cost.total', total, { shouldValidate: true });
    }

    const plantValue = parseFloat(cost?.plant || 0);
    if (!Number.isFinite(plantValue)) {
      if (methods.getValues('finance.project_category') !== '') {
        methods.setValue('finance.project_category', '', { shouldValidate: true });
      }
      return;
    }
    if (Number.isFinite(plantValue)) {
      let category = 'Large';
      if (plantValue <= 2.5) category = 'Micro';
      else if (plantValue <= 25) category = 'Small';
      else if (plantValue <= 125) category = 'Medium';
      if (methods.getValues('finance.project_category') !== category) {
        methods.setValue('finance.project_category', category, { shouldValidate: true });
      }
    }
  };

  const computeFinanceMeansTotal = (methods: any) => {
    if (!methods) return;
    const means = methods.getValues('finance.means') || {};
    const sum = ['promoter_equity', 'institution_equity', 'foreign_equity', 'term_loans', 'others']
      .map((key) => parseFloat(means?.[key] || 0))
      .reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
    const total = Number.isFinite(sum) ? sum.toString() : '';
    if (methods.getValues('finance.means.total') !== total) {
      methods.setValue('finance.means.total', total, { shouldValidate: true });
    }
  };

  const formConfig: DynamicFormConfig = {
    id: 'inprinciple-application',
    showStepIndicator: true,
    allowStepNavigation: true,
    validateOnStepChange: true,
    submitButtonText: 'Submit Application',
    steps: [
      buildCompanyDetailsStep({
        countries: countries || [],
        corpStates: corpStates || [],
        corrStates: corrStates || [],
        corpDistrictOptions,
        corpTehsilOptions,
        corrDistrictOptions,
        corrTehsilOptions,
        panPattern,
        digitsPattern,
        emailPattern,
        validateOptionalDigits,
        validateOptionalEmail,
        setCorpCountryId,
        setCorpStateId,
        setCorpDistrictId,
        setCorrCountryId,
        setCorrStateId,
        setCorrDistrictId,
        setFormMethodsRef: (methods) => {
          formMethodsRef.current = methods;
        },
      }),
      buildAuthorisedSignatoryPromoterDetailsStep({
        promoters,
        setPromoters,
        formUploads,
        setFormUploads,
        uploadingFiles,
        setFileInputResetKey,
        digitsPattern,
        emailPattern,
        aadhaarPattern,
        validateOptionalDigits,
        renderUploadField,
        renderFileCell,
        renderBooleanIcon,
        formatTextValue,
      }),
      buildProposedProjectDetailsStep({
        capacityItems,
        setCapacityItems,
        productItems,
        setProductItems,
        nicCodes: nicCodes || [],
        hsnCodes: hsnCodes || [],
        filteredNicCodes,
        filteredHsnCodes,
        setFilteredNicCodes,
        setFilteredHsnCodes,
        sectorOptions,
        digitsPattern,
        conditionalRequired,
        getFieldError,
        setFormMethodsRef: (methods) => {
          formMethodsRef.current = methods;
        },
      }),
      buildProjectFinanceStep({
        digitsPattern,
        getFieldError,
        computeFinanceDerived,
        computeFinanceMeansTotal,
      }),
      buildProjectRequirementStep({
        yesNoOptions,
        casteOptions,
        pollutionActivityOptions,
        projectDistrictOptions,
        projectTehsilOptions,
        projectVillages: projectVillages || [],
        landRequirementOptions,
        landOwnershipOptions,
        landUseOptions,
        developmentAuthorityOptions,
        industrialAreaOptions,
        siidculEstateOptions,
        msmeEstateOptions,
        electricitySourceOptions,
        waterSourceOptions,
        electricityDetails,
        setElectricityDetails,
        waterDetails,
        setWaterDetails,
        digitsPattern,
        conditionalRequired,
        getFieldError,
        renderUploadField,
        setProjectDistrictId,
        setProjectTehsilId,
      }),
      buildSupportingDocumentsStep({
        inprincipleDocuments,
        uploadedDocuments,
        canUploadDocuments,
        onOpenUpload: openUploadModal,
        uploadModalOpen,
        uploadModalDoc,
        uploadForm,
        setUploadForm,
        onCloseUpload: closeUploadModal,
        onSubmitUpload: submitUpload,
        uploadError,
        uploading,
      }),
      buildPaymentStep({
        setFormMethodsRef: (methods) => {
          formMethodsRef.current = methods;
        },
      }),
      buildApplicationSigningStep({
        setFormMethodsRef: (methods) => {
          formMethodsRef.current = methods;
        },
      }),
      buildSummaryStep({
        setFormMethodsRef: (methods) => {
          formMethodsRef.current = methods;
        },
      }),

    ],
    onSubmit: async (data) => {
      const districtId = Number(data?.requirement?.land?.district || 0);
      if (!districtId) {
        alert('Please select District in Project Requirement > Land Details before submitting.');
        return;
      }
      if (!Array.isArray(data?.promoter?.entries) || data.promoter.entries.length === 0) {
        alert('Please add at least one promoter before submitting.');
        return;
      }
      if (!Array.isArray(data?.project?.capacity_items) || data.project.capacity_items.length === 0) {
        alert('Please add at least one Proposed Capacity entry before submitting.');
        return;
      }
      if (!Array.isArray(data?.project?.product_items) || data.project.product_items.length === 0) {
        alert('Please add at least one Product Details entry before submitting.');
        return;
      }
      if (data?.requirement?.power?.required === 'yes') {
        const powerDetails = data?.requirement?.power?.details || [];
        if (!Array.isArray(powerDetails) || powerDetails.length === 0) {
          alert('Please add at least one Electricity entry before submitting.');
          return;
        }
      }
      if (data?.requirement?.water?.required === 'yes') {
        const waterDetailsList = data?.requirement?.water?.details || [];
        if (!Array.isArray(waterDetailsList) || waterDetailsList.length === 0) {
          alert('Please add at least one Water entry before submitting.');
          return;
        }
      }

      try {
        await apiClient.post('/investor/inprinciple/submit', {
          serviceId,
          departmentId,
          processingLevel: 'District',
          formData: { ...data, __currentStep: formConfig.steps.length },
          unitName: data?.company?.name || '',
          districtId,
          cafType: proposalType,
        });

        alert('Application submitted successfully!');
      } catch (error: any) {
        console.error(error);
        alert(error?.response?.data?.message || 'Application submission failed. Please try again.');
      }
    },
    onStepChange: async (step, data, meta) => {
      const fromStep = Number.isFinite(meta?.fromStep)
        ? Number(meta?.fromStep)
        : Math.max(step - 1, 0);
      if (Number.isFinite(meta?.toStep) && Number(meta?.toStep) < fromStep) {
        return true;
      }
      const draftStep = Math.max(fromStep, 0);
      const steps = formConfig.steps;
      const currentStep = draftStep;
      const currentTitle = steps[currentStep]?.title || '';
      const toStep = Number.isFinite(meta?.toStep) ? Number(meta?.toStep) : step;
      const supportingIndex = steps.findIndex((s) => s.title === 'Supporting Documents');
      if (supportingIndex !== -1 && toStep > supportingIndex) {
        const requiredDocs = (inprincipleDocuments || []).filter(
          (doc) => String(doc.isRequired || '').toUpperCase() === 'Y'
        );
        const missing = requiredDocs.filter((doc) => !uploadedDocuments[String(doc.id)]);
        if (missing.length > 0) {
          alert('Please upload all mandatory documents before proceeding.');
          return false;
        }
      }

      if (currentTitle === 'Authorised Signatory & Promoter Details') {
        const entries = data?.promoter?.entries || [];
        if (!Array.isArray(entries) || entries.length === 0) {
          alert('Please add at least one promoter.');
          return false;
        }
      }

      if (currentTitle === 'Proposed Project Details') {
        const formCapacityItems = data?.project?.capacity_items || [];
        const formProductItems = data?.project?.product_items || [];
        const localCapacityItems = capacityItems;
        const localProductItems = productItems;
        const resolvedCapacityItems =
          (Array.isArray(formCapacityItems) && formCapacityItems.length > 0
            ? formCapacityItems
            : localCapacityItems) || [];
        const resolvedProductItems =
          (Array.isArray(formProductItems) && formProductItems.length > 0
            ? formProductItems
            : localProductItems) || [];
        if (resolvedCapacityItems.length > 0 && formCapacityItems.length === 0) {
          formMethodsRef.current?.setValue?.('project.capacity_items', resolvedCapacityItems);
        }
        if (resolvedProductItems.length > 0 && formProductItems.length === 0) {
          formMethodsRef.current?.setValue?.('project.product_items', resolvedProductItems);
        }
        if (!Array.isArray(resolvedCapacityItems) || resolvedCapacityItems.length === 0) {
          alert('Please add at least one Proposed Capacity entry.');
          return false;
        }
        if (!Array.isArray(resolvedProductItems) || resolvedProductItems.length === 0) {
          alert('Please add at least one Product Details entry.');
          return false;
        }
      }

      if (currentTitle === 'Project Requirement') {
        const electricityRequired = data?.requirement?.power?.required === 'yes';
        const formElectricityDetails = data?.requirement?.power?.details || [];
        const resolvedElectricityDetails =
          (Array.isArray(formElectricityDetails) && formElectricityDetails.length > 0
            ? formElectricityDetails
            : electricityDetails) || [];
        if (electricityRequired && resolvedElectricityDetails.length === 0) {
          alert('Please add at least one Electricity entry.');
          return false;
        }
        const waterRequired = data?.requirement?.water?.required === 'yes';
        const formWaterDetails = data?.requirement?.water?.details || [];
        const resolvedWaterDetails =
          (Array.isArray(formWaterDetails) && formWaterDetails.length > 0
            ? formWaterDetails
            : waterDetails) || [];
        if (waterRequired && resolvedWaterDetails.length === 0) {
          alert('Please add at least one Water entry.');
          return false;
        }
      }

      if (currentTitle === 'Supporting Documents') {
        const requiredDocs = (inprincipleDocuments || []).filter(
          (doc) => String(doc.isRequired || '').toUpperCase() === 'Y'
        );
        const missing = requiredDocs.filter((doc) => !uploadedDocuments[String(doc.id)]);
        if (missing.length > 0) {
          alert('Please upload all mandatory documents before proceeding.');
          return false;
        }
      }

      const ok = await saveDraft(data, draftStep);
      if (ok === false) {
        return false;
      }
      markCompletedThroughStep(draftStep);
      console.log(`Moved to step ${step + 1}`);
      return true;
    },
  };

  useEffect(() => {
    formStepsRef.current = formConfig.steps;
  }, [formConfig]);

  useEffect(() => {
    if (shouldLogout) {
      logout();
    }
  }, [shouldLogout, logout]);

  useEffect(() => {
    if (!draftValues) return;
    const savedStep = Number(draftValues?.__currentStep ?? -1);
    const stepsForCompute = formStepsRef.current.length ? formStepsRef.current : formConfig.steps;
    const { completed, nextStep } = computeCompletedSteps(
      draftValues,
      stepsForCompute,
      savedStep,
      true
    );
    updateCompletionState(completed, nextStep, true);
    if (formMethodsRef.current) {
      setTimeout(() => computeFinanceDerived(formMethodsRef.current), 0);
      setTimeout(() => computeFinanceMeansTotal(formMethodsRef.current), 0);
    }
  }, [draftValues]);

  return (
    <div className="max-w mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">In-Principle Application Form</h1>
            <p className="text-gray-500 mt-1">
              Fields marked with <span style={{ color: '#dc2626' }}>*</span> are mandatory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow hover:from-amber-500 hover:to-orange-600"
            >
              Fill form using DPR
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow hover:from-emerald-600 hover:to-teal-600"
            >
              Fill form with Voice Command
            </button>
            <div className="text-xs text-gray-500 min-w-[60px] text-right">
              {savingDraft ? 'Saving?' : ''}
            </div>
          </div>
        </div>
        {toastMessage && (
          <div className="mt-3 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {toastMessage}
          </div>
        )}
        {draftLoading && (
          <div className="mt-2 text-xs text-gray-500">Loading draft data...</div>
        )}
      </div>
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-gray-900">{authModalTitle}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  if (shouldLogout) {
                    logout();
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ?
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">{authModalMessage}</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <DynamicForm
          key={`${proposalType}-${companyName || 'company'}`}
          config={formConfig}
          defaultValues={formDefaults}
          initialStep={initialStep}
          initialCompletedSteps={completedSteps}
        />
      </div>
    </div>
  );
};







