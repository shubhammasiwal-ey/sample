import type { ReactElement } from 'react';
import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type ProjectRequirementContext = {
  yesNoOptions: { label: string; value: string }[];
  casteOptions: { label: string; value: string }[];
  pollutionActivityOptions: { value: string | number; label: string; category?: string }[];
  projectDistrictOptions: { label: string; value: string | number }[];
  projectTehsilOptions: { label: string; value: string | number }[];
  projectVillages: { label: string; value: string | number }[];
  landRequirementOptions: { label: string; value: string }[];
  landOwnershipOptions: { label: string; value: string }[];
  landUseOptions: { label: string; value: string }[];
  developmentAuthorityOptions: { label: string; value: string }[];
  industrialAreaOptions: { label: string; value: string }[];
  siidculEstateOptions: { label: string; value: string }[];
  msmeEstateOptions: { label: string; value: string }[];
  electricitySourceOptions: { label: string; value: string }[];
  waterSourceOptions: { label: string; value: string }[];
  electricityDetails: any[];
  setElectricityDetails: (next: any[]) => void;
  waterDetails: any[];
  setWaterDetails: (next: any[]) => void;
  digitsPattern: RegExp;
  conditionalRequired: (fieldPath: string, expectedValue: string, message: string) => (value: any) => true | string;
  getFieldError: (methods: any, name: string) => string | undefined;
  renderUploadField: (name: string, label: string, accept: string, requiredMessage: string) => (methods: any) => ReactElement;
  setProjectDistrictId: (value: string | number) => void;
  setProjectTehsilId: (value: string | number) => void;
};

export const buildProjectRequirementStep = (ctx: ProjectRequirementContext): Step => {
  const {
    yesNoOptions,
    casteOptions,
    pollutionActivityOptions,
    projectDistrictOptions,
    projectTehsilOptions,
    projectVillages,
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
  } = ctx;

  return {
  id: 'step-5',
  title: 'Project Requirement',
  sections: [
    {
      id: 'land-details',
      title: 'Land Details',
      columns: 3,
        fields: [
        {
          name: 'requirement.land.requirement_type',
          label: 'Whether your project / business requires?',
          type: 'select',
          options: landRequirementOptions,
          validation: { required: 'Please select requirement type' },
        },
        {
          name: 'requirement.land.area',
          label: 'Land required for proposed project (in Acres)',
          type: 'text',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'land', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.requirement_type',
              'land',
              'Please enter land required for proposed project'
            ),
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Land required should be numeric' },
          },
        },
        {
          name: 'requirement.land.built_up_area',
          label: 'Built-up area required (in Sqm.)',
          type: 'text',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'built_up_space_it_ites', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.requirement_type',
              'built_up_space_it_ites',
              'Please enter built-up area required'
            ),
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Built-up area should be numeric' },
          },
        },
        {
          name: 'requirement.land.available_with_applicant',
          label: 'Is Land / Built-up space (IT / ITES) available with applicant?',
          type: 'select',
          options: yesNoOptions,
          validation: { required: 'Please select an option' },
        },
        {
          name: 'requirement.land.ownership_nature',
          label: 'Nature of ownership of land for the proposed project / business',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const reqType = methods.watch('requirement.land.requirement_type');
            const available = methods.watch('requirement.land.available_with_applicant');
            if (reqType !== 'land' || available !== 'yes') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nature of ownership of land for the proposed project / business <span className="text-red-600">*</span>
                </label>
                <select
                  {...methods.register('requirement.land.ownership_nature', {
                    validate: (value: string) =>
                      value ? true : 'Please select land ownership',
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select</option>
                  {landOwnershipOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {getFieldError(methods, 'requirement.land.ownership_nature') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.ownership_nature')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.industrial_area',
          label: 'Unit Address: Industrial Area',
          type: 'select',
          options: industrialAreaOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'owned_inside_notified', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'owned_inside_notified',
              'Please select industrial area'
            ),
          },
        },
        {
          name: 'requirement.land.pending_loan_outside',
          label: 'Is there any pending loan on the land?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'owned_outside_notified', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'owned_outside_notified',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.current_use_outside',
          label: 'Current Land Use',
          type: 'select',
          options: landUseOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'owned_outside_notified', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'owned_outside_notified',
              'Please select land use'
            ),
          },
        },
        {
          name: 'requirement.land.development_authority_outside',
          label: 'Does Land Falls Under Any Development Authority?',
          type: 'select',
          options: developmentAuthorityOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'owned_outside_notified', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'owned_outside_notified',
              'Please select development authority'
            ),
          },
        },
        {
          name: 'requirement.land.siidcul_estate',
          label: 'SIIDCUL Estates',
          type: 'select',
          options: siidculEstateOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'siidcul_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'siidcul_lease',
              'Please select SIIDCUL estate'
            ),
          },
        },
        {
          name: 'requirement.land.siidcul_plot_number',
          label: 'SIIDCUL Plot Number',
          type: 'text',
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'siidcul_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'siidcul_lease',
              'Please enter plot number'
            ),
          },
        },
        {
          name: 'requirement.land.msme_estate',
          label: 'MSME Estate\'s',
          type: 'select',
          options: msmeEstateOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'mini_industrial_area_dic', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'mini_industrial_area_dic',
              'Please select MSME estate'
            ),
          },
        },
        {
          name: 'requirement.land.msme_plot_number',
          label: 'Plot Number',
          type: 'text',
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'mini_industrial_area_dic', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'mini_industrial_area_dic',
              'Please enter plot number'
            ),
          },
        },
        {
          name: 'requirement.land.lessor_physically_challenged',
          label: 'Is Lessor Physically challenged?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.lessor_armed_forces',
          label: 'Is Lessor with Indian Armed forces?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.lessor_caste',
          label: 'Caste of lessor',
          type: 'select',
          options: casteOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select caste'
            ),
          },
        },
        {
          name: 'requirement.land.pending_loan_lease',
          label: 'Is there any pending loan on the land?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.current_use_lease',
          label: 'Current Land Use',
          type: 'select',
          options: landUseOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select land use'
            ),
          },
        },
        {
          name: 'requirement.land.development_authority_lease',
          label: 'Does Land Falls Under Any Development Authority?',
          type: 'select',
          options: developmentAuthorityOptions,
          dependsOn: { field: 'requirement.land.ownership_nature', value: 'private_rent_lease', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.ownership_nature',
              'private_rent_lease',
              'Please select development authority'
            ),
          },
        },
        {
          name: 'requirement.land.identified_for_purchase',
          label: 'Has Land been identified for purchase?',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const reqType = methods.watch('requirement.land.requirement_type');
            const available = methods.watch('requirement.land.available_with_applicant');
            if (reqType !== 'land' || available !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Land been identified for purchase? <span className="text-red-600">*</span>
                </label>
                <select
                  {...methods.register('requirement.land.identified_for_purchase', {
                    validate: (value: string) => (value ? true : 'Please select an option'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select</option>
                  {yesNoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {getFieldError(methods, 'requirement.land.identified_for_purchase') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.identified_for_purchase')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.resident_uttarakhand',
          label: 'Are you a resident of Uttarakhand?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.currently_own_uk',
          label: 'Do you currently own any land in Uttarakhand?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.purchase_above_12_5',
          label: 'Will the purchase increase your holding above 12.5 Acres?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.pending_loan_purchase',
          label: 'Is there any pending loan on the land?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.current_use_purchase',
          label: 'Current Land Use',
          type: 'select',
          options: landUseOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select land use'
            ),
          },
        },
        {
          name: 'requirement.land.development_authority_purchase',
          label: 'Does Land Falls Under Any Development Authority?',
          type: 'select',
          options: developmentAuthorityOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select development authority'
            ),
          },
        },
        {
          name: 'requirement.land.seller_caste',
          label: 'Caste of Seller of proposed land',
          type: 'select',
          options: casteOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'yes',
              'Please select caste'
            ),
          },
        },
        {
          name: 'requirement.land.assistance_required',
          label: 'Would you like assistance to identify land for purchase?',
          type: 'select',
          options: yesNoOptions,
          dependsOn: { field: 'requirement.land.identified_for_purchase', value: 'no', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.identified_for_purchase',
              'no',
              'Please select an option'
            ),
          },
        },
        {
          name: 'requirement.land.preferred_district',
          label: 'Preferred District for Purchase',
          type: 'select',
          options: projectDistrictOptions,
          searchable: true,
          dependsOn: { field: 'requirement.land.assistance_required', value: 'yes', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.assistance_required',
              'yes',
              'Please select preferred district'
            ),
          },
        },
        {
          name: 'requirement.land.proposed_district',
          label: 'Which district are you proposing to establish the unit?',
          type: 'select',
          options: projectDistrictOptions,
          searchable: true,
          dependsOn: { field: 'requirement.land.assistance_required', value: 'no', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.assistance_required',
              'no',
              'Please select proposed district'
            ),
          },
        },
        {
          name: 'requirement.land.total_plot_area_sqmt',
          label: 'Total Plot Area Required (In Sqmt.)',
          type: 'text',
          dependsOn: { field: 'requirement.land.assistance_required', value: 'no', show: true },
          validation: {
            validate: conditionalRequired(
              'requirement.land.assistance_required',
              'no',
              'Please enter total plot area'
            ),
          },
        },
        {
          name: 'requirement.land.district',
          label: 'District',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const requirementType = methods.watch('requirement.land.requirement_type');
            const assistance = methods.watch('requirement.land.assistance_required');
            if (requirementType !== 'land' || assistance !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District <span className="text-red-600">*</span>
                </label>
                <select
                  {...methods.register('requirement.land.district', {
                    validate: (value: string) => (value ? true : 'Please select district'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  onChange={(event) => {
                    const value = event.target.value;
                    methods.setValue('requirement.land.district', value);
                    setProjectDistrictId(value);
                    setProjectTehsilId('');
                    methods.setValue('requirement.land.block', '');
                    methods.setValue('requirement.land.village', '');
                  }}
                >
                  <option value="">Select</option>
                  {projectDistrictOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {getFieldError(methods, 'requirement.land.district') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.district')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.block',
          label: 'Block',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const requirementType = methods.watch('requirement.land.requirement_type');
            const assistance = methods.watch('requirement.land.assistance_required');
            if (requirementType !== 'land' || assistance !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block <span className="text-red-600">*</span>
                </label>
                <select
                  {...methods.register('requirement.land.block', {
                    validate: (value: string) => (value ? true : 'Please select block'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  onChange={(event) => {
                    const value = event.target.value;
                    methods.setValue('requirement.land.block', value);
                    setProjectTehsilId(value);
                    methods.setValue('requirement.land.village', '');
                  }}
                >
                  <option value="">Select</option>
                  {projectTehsilOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {getFieldError(methods, 'requirement.land.block') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.block')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.village',
          label: 'Village/Town',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const requirementType = methods.watch('requirement.land.requirement_type');
            const assistance = methods.watch('requirement.land.assistance_required');
            if (requirementType !== 'land' || assistance !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village/Town <span className="text-red-600">*</span>
                </label>
                <input
                  {...methods.register('requirement.land.village', {
                    validate: (value: string) => (value ? true : 'Please enter village/town'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'requirement.land.village') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.village')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.survey_no',
          label: 'Survey No/Khata No',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const requirementType = methods.watch('requirement.land.requirement_type');
            const assistance = methods.watch('requirement.land.assistance_required');
            if (requirementType !== 'land' || assistance !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey No/Khata No <span className="text-red-600">*</span>
                </label>
                <input
                  {...methods.register('requirement.land.survey_no', {
                    validate: (value: string) => (value ? true : 'Please enter survey/khata number'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'requirement.land.survey_no') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.survey_no')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'requirement.land.land_code',
          label: 'Khasra No.',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const requirementType = methods.watch('requirement.land.requirement_type');
            const assistance = methods.watch('requirement.land.assistance_required');
            if (requirementType !== 'land' || assistance !== 'no') return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khasra No. <span className="text-red-600">*</span>
                </label>
                <input
                  {...methods.register('requirement.land.land_code', {
                    validate: (value: string) => (value ? true : 'Please enter khasra number'),
                  })}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'requirement.land.land_code') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'requirement.land.land_code')}
                  </p>
                )}
              </div>
            );
          },
        },
      ],
    },
    {
      id: 'land-documents',
      title: 'Land Documents & Authority',
      columns: 3,
      fields: [
        { name: 'requirement.land.lpa_name', label: 'Name of Local Planning Authority', type: 'text' },
        {
          name: 'requirement.land.heritage_distance',
          label: 'Distance between site and Heritage site (km)',
          type: 'text',
        },
        {
          name: 'requirement.land.consent_letter',
          label: 'Upload Consent Letter',
          type: 'file',
          accept: '.pdf',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'land', show: true },
        },
        {
          name: 'requirement.land.sketch',
          label: 'Upload Sketch',
          type: 'file',
          accept: '.pdf',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'land', show: true },
        },
        {
          name: 'requirement.land.ror',
          label: 'Upload RoR',
          type: 'file',
          accept: '.pdf',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'land', show: true },
        },
        {
          name: 'requirement.land.agreement_to_sell',
          label: 'Upload Agreement to Sell',
          type: 'file',
          accept: '.pdf',
          dependsOn: { field: 'requirement.land.requirement_type', value: 'land', show: true },
        },
      ],
    },
    {
            id: 'utilities',
            title: 'Utilities',
            columns: 3,
            fields: [
              {
                name: 'requirement.power.required',
                label: 'Electricity',
                type: 'radio',
                options: yesNoOptions,
                validation: { required: 'Please select electricity requirement' },
              },
              {
                name: 'requirement.water.required',
                label: 'Water',
                type: 'radio',
                options: yesNoOptions,
                validation: { required: 'Please select water requirement' },
              },
            ],
          },
          {
            id: 'electricity-details',
            title: 'Electricity',
            columns: 3,
            dependsOn: { field: 'requirement.power.required', value: 'yes', show: true },
            fields: [
              { name: 'requirement.power.details', type: 'hidden' },
              {
                name: 'requirement.power.entries',
                label: '',
                type: 'custom',
                colSpan: 3,
                render: (methods) => {
                  const handleAdd = async () => {
                    const fieldsToValidate = [
                      'requirement.power.source',
                      'requirement.power.annual_consumption',
                      'requirement.power.load',
                    ];
                    const isValid = await methods.trigger(fieldsToValidate);
                    if (!isValid) return;

                    const data = methods.getValues('requirement.power') || {};
                    const entry = {
                      source: data.source,
                      annual_consumption: data.annual_consumption,
                      load: data.load,
                    };
                    const next = [...electricityDetails, entry];
                    setElectricityDetails(next);
                    methods.setValue('requirement.power.details', next);
                    methods.setValue('requirement.power.source', '');
                    methods.setValue('requirement.power.annual_consumption', '');
                    methods.setValue('requirement.power.load', '');
                  };

                  const handleRemove = (index: number) => {
                    const next = electricityDetails.filter((_, i) => i !== index);
                    setElectricityDetails(next);
                    methods.setValue('requirement.power.details', next);
                  };

                  const getSourceLabel = (value?: string) =>
                    electricitySourceOptions.find((opt) => opt.value === value)?.label || '-';

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source of Electricity <span className="text-red-600">*</span>
                          </label>
                          <select
                            {...methods.register('requirement.power.source', {
                              required: 'Please select source of electricity',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          >
                            <option value="">Select</option>
                            {electricitySourceOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Annual Electricity Consumption (In KW) <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...methods.register('requirement.power.annual_consumption', {
                              required: 'Please enter annual consumption',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Electricity Load (In KW) <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...methods.register('requirement.power.load', {
                              required: 'Please enter electricity load',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div className="col-span-12 flex justify-start">
                          <button
                            type="button"
                            onClick={handleAdd}
                            className="px-6 py-2.5 bg-primary text-white border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-red-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {electricityDetails.length > 0 && (
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-700 text-white">
                              <tr>
                                <th className="px-4 py-3">Source of Electricity</th>
                                <th className="px-4 py-3">Electricity Consumption</th>
                                <th className="px-4 py-3">Electricity Load (In KW)</th>
                                <th className="px-4 py-3">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {electricityDetails.map((item, index) => (
                                <tr key={`${item.source}-${index}`} className="border-t border-gray-200">
                                  <td className="px-4 py-3">{getSourceLabel(item.source)}</td>
                                  <td className="px-4 py-3">{item.annual_consumption || '-'}</td>
                                  <td className="px-4 py-3">{item.load || '-'}</td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemove(index)}
                                      className="text-red-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                },
              },
            ],
          },
          {
            id: 'water-details',
            title: 'Water',
            columns: 3,
            dependsOn: { field: 'requirement.water.required', value: 'yes', show: true },
            fields: [
              { name: 'requirement.water.details', type: 'hidden' },
              {
                name: 'requirement.water.entries',
                label: '',
                type: 'custom',
                colSpan: 3,
                render: (methods) => {
                  const handleAdd = async () => {
                    const fieldsToValidate = [
                      'requirement.water.source',
                      'requirement.water.industrial_consumption',
                      'requirement.water.domestic_consumption',
                    ];
                    const isValid = await methods.trigger(fieldsToValidate);
                    if (!isValid) return;

                    const data = methods.getValues('requirement.water') || {};
                    const total =
                      (parseFloat(data.industrial_consumption || '0') || 0) +
                      (parseFloat(data.domestic_consumption || '0') || 0);
                    const entry = {
                      source: data.source,
                      industrial_consumption: data.industrial_consumption,
                      domestic_consumption: data.domestic_consumption,
                      total_consumption: total ? total.toFixed(2) : '',
                    };
                    const next = [...waterDetails, entry];
                    setWaterDetails(next);
                    methods.setValue('requirement.water.details', next);
                    methods.setValue('requirement.water.source', '');
                    methods.setValue('requirement.water.industrial_consumption', '');
                    methods.setValue('requirement.water.domestic_consumption', '');
                  };

                  const handleRemove = (index: number) => {
                    const next = waterDetails.filter((_, i) => i !== index);
                    setWaterDetails(next);
                    methods.setValue('requirement.water.details', next);
                  };

                  const getSourceLabel = (value?: string) =>
                    waterSourceOptions.find((opt) => opt.value === value)?.label || '-';

                  const industrialValue = methods.watch('requirement.water.industrial_consumption') || '';
                  const domesticValue = methods.watch('requirement.water.domestic_consumption') || '';
                  const totalValue =
                    (parseFloat(industrialValue || '0') || 0) + (parseFloat(domesticValue || '0') || 0);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source of Water <span className="text-red-600">*</span>
                          </label>
                          <select
                            {...methods.register('requirement.water.source', {
                              required: 'Please select source of water',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          >
                            <option value="">Select</option>
                            {waterSourceOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Industrial Water Consumption (Liters / Year) <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...methods.register('requirement.water.industrial_consumption', {
                              required: 'Please enter industrial consumption',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domestic Water Consumption (Liters / Year) <span className="text-red-600">*</span>
                          </label>
                          <input
                            {...methods.register('requirement.water.domestic_consumption', {
                              required: 'Please enter domestic consumption',
                            })}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Water Requirement (KL / Year)
                          </label>
                          <input
                            readOnly
                            value={totalValue ? totalValue.toFixed(2) : ''}
                            className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black bg-gray-100"
                          />
                        </div>
                        <div className="col-span-12 flex justify-start">
                          <button
                            type="button"
                            onClick={handleAdd}
                            className="px-6 py-2.5 bg-primary text-white border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-red-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {waterDetails.length > 0 && (
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-700 text-white">
                              <tr>
                                <th className="px-4 py-3">Source of Water</th>
                                <th className="px-4 py-3">Industrial Water Consumption (Liters / Year)</th>
                                <th className="px-4 py-3">Domestic Water Consumption (Liters / Year)</th>
                                <th className="px-4 py-3">Total Water Consumption</th>
                                <th className="px-4 py-3">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {waterDetails.map((item, index) => (
                                <tr key={`${item.source}-${index}`} className="border-t border-gray-200">
                                  <td className="px-4 py-3">{getSourceLabel(item.source)}</td>
                                  <td className="px-4 py-3">{item.industrial_consumption || '-'}</td>
                                  <td className="px-4 py-3">{item.domestic_consumption || '-'}</td>
                                  <td className="px-4 py-3">{item.total_consumption || '-'}</td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemove(index)}
                                      className="text-red-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                },
              },
            ],
          },
          {
      id: 'pollution-control',
      title: 'Pollution Control',
      columns: 3,
        fields: [
              {
                name: 'requirement.pollution.activity_type',
                label: 'Type of Activity (UKPCB Guidelines) *',
                type: 'select',
                options: pollutionActivityOptions,
                searchable: true,
                validation: { required: 'Please select activity type' },
                onChange: (value, methods) => {
                  const selected = pollutionActivityOptions.find(
                    (item) => String(item.value) === String(value)
                  );
                  methods.setValue('requirement.pollution.category', selected?.category || '');
                },
              },
              {
                name: 'requirement.pollution.category',
                label: 'Pollution Categories',
                type: 'custom',
                colSpan: 1,
                render: (methods) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pollution Categories <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      {...methods.register('requirement.pollution.category', {
                        required: 'Please select activity to populate category',
                      })}
                      value={methods.watch('requirement.pollution.category') || ''}
                      className="w-full px-3 py-2.5 border rounded text-sm bg-gray-100 border-gray-300"
                    />
                    {getFieldError(methods, 'requirement.pollution.category') && (
                      <p className="mt-1 text-sm text-red-600 font-medium">
                        {getFieldError(methods, 'requirement.pollution.category')}
                      </p>
                    )}
                  </div>
                ),
              },
              {
          name: 'requirement.pollution.clearance',
          label: 'Environment Clearance',
          type: 'radio',
          options: [
            { label: 'Ministry of Environment, Forest and Climate Change', value: 'moef' },
            { label: 'State Environment Impact Assessment Authority', value: 'seiaa' },
            { label: 'N/A', value: 'na' },
          ],
        },
      ],
    },
    {
      id: 'govt-support',
      title: 'Any Support Required from Govt.',
      columns: 1,
      fields: [
        { name: 'requirement.support', label: 'Support Required', type: 'textarea', rows: 4 },
      ],
    },
  ],
};
};
