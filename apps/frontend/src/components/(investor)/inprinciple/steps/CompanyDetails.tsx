import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type CompanyDetailsContext = {
  countries: { label: string; value: string | number }[];
  corpStates: { label: string; value: string | number }[];
  corrStates: { label: string; value: string | number }[];
  corpDistrictOptions: { label: string; value: string | number }[];
  corpTehsilOptions: { label: string; value: string | number }[];
  corrDistrictOptions: { label: string; value: string | number }[];
  corrTehsilOptions: { label: string; value: string | number }[];
  panPattern: RegExp;
  digitsPattern: RegExp;
  emailPattern: RegExp;
  validateOptionalDigits: (min: number, max: number, label: string) => (value: string) => true | string;
  validateOptionalEmail: (value: string) => true | string;
  setCorpCountryId: (value: string | number) => void;
  setCorpStateId: (value: string | number | undefined) => void;
  setCorpDistrictId: (value: string | number | undefined) => void;
  setCorrCountryId: (value: string | number) => void;
  setCorrStateId: (value: string | number | undefined) => void;
  setCorrDistrictId: (value: string | number | undefined) => void;
  setFormMethodsRef: (methods: any) => void;
};

export const buildCompanyDetailsStep = (ctx: CompanyDetailsContext): Step => ({
  id: 'step-1',
  title: 'Company Details',
  sections: [
    {
      id: 'company-details',
      title: 'Company Details',
      columns: 3,
      fields: [
        {
          name: 'company.proposal_type',
          label: 'Type of Proposal',
          type: 'select',
          options: [
            { label: 'New Project', value: 'new' },
            { label: 'Extension', value: 'extension' },
            { label: 'Modernisation', value: 'modernisation' },
            { label: 'Diversification', value: 'diversification' },
            { label: 'Amendment', value: 'amendment' },
            { label: 'Expansion', value: 'expansion' },
          ],
          disabled: true,
          validation: { required: 'Please select type of proposal' },
        },
        {
          name: 'company.primary_activity',
          label: 'Primary Activity of Project',
          type: 'select',
          options: [
            { label: 'Manufacturing', value: 'manufacturing' },
            { label: 'Service', value: 'service' },
          ],
          validation: { required: 'Please select activity' },
        },
        {
          name: 'company.name',
          label: 'Name of the Company/Unit/Trust',
          type: 'text',
          validation: { required: 'Please enter company name' },
        },
        {
          name: 'company.constitution',
          label: 'Constitution of the Establishment',
          type: 'select',
          options: [
            { label: 'Partnership', value: 'partnership' },
            { label: 'Proprietery', value: 'proprietery' },
            { label: 'Private Limited', value: 'private_limited' },
            { label: 'Public Limited', value: 'public_limited' },
            { label: 'Co-operative', value: 'co_operative' },
            { label: 'Other', value: 'other' },
          ],
          validation: { required: 'Please select constitution' },
        },
        {
          name: 'company.pan',
          label: 'PAN Number',
          type: 'text',
          validation: {
            required: 'Please enter PAN',
            pattern: { value: ctx.panPattern, message: 'Please enter a valid PAN' },
          },
        },
        {
          name: 'company.cin',
          label: 'Corporate Identification Number (CIN)',
          type: 'text',
          validation: { required: 'Please enter CIN' },
        },
        {
          name: 'company.incorporation_date',
          label: 'Date of Incorporation',
          type: 'date',
          validation: { required: 'Please select date of incorporation' },
        },
        {
          name: 'company.gst_available',
          label: 'Do you have GST Number',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'company.gst_number',
          label: 'GST Number',
          type: 'text',
          validation: {
            required: 'Please enter GST Number',
            pattern: { value: ctx.digitsPattern, message: 'GST Number should contain digits only' },
          },
          dependsOn: { field: 'company.gst_available', value: 'yes', show: true },
        },
        {
          name: 'company.is_startup',
          label: 'Is a Startup Company?',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'company.origin_country',
          label: 'Country of Origin',
          type: 'select',
          options: ctx.countries || [],
          searchable: true,
        },
      ],
    },
    {
      id: 'corporate-address',
      title: 'Corporate Address',
      columns: 3,
      fields: [
        {
          name: 'company.corp.country',
          label: 'Country',
          type: 'select',
          options: ctx.countries || [],
          searchable: true,
          validation: { required: 'Please select country' },
          onChange: (value, methods) => {
            ctx.setCorpCountryId(value);
            ctx.setCorpStateId(undefined);
            ctx.setCorpDistrictId(undefined);
            methods.setValue('company.corp.state', '');
            methods.setValue('company.corp.district', '');
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.state',
          label: 'State',
          type: 'select',
          options: ctx.corpStates || [],
          searchable: true,
          validation: { required: 'Please select state' },
          onChange: (value, methods) => {
            ctx.setCorpStateId(value);
            ctx.setCorpDistrictId(undefined);
            methods.setValue('company.corp.district', '');
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.district',
          label: 'District',
          type: 'select',
          options: ctx.corpDistrictOptions,
          searchable: true,
          validation: { required: 'Please select district' },
          onChange: (value, methods) => {
            ctx.setCorpDistrictId(value);
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.block',
          label: 'Block',
          type: 'select',
          options: ctx.corpTehsilOptions,
          searchable: true,
          validation: { required: 'Please select Block' },
        },
        { name: 'company.corp.city', label: 'City', type: 'text', validation: { required: 'Please enter city' } },
        {
          name: 'company.corp.address1',
          label: 'Address Line 1',
          type: 'text',
          validation: { required: 'Please enter address line 1' },
        },
        { name: 'company.corp.address2', label: 'Address Line 2', type: 'text' },
        {
          name: 'company.corp.pincode',
          label: 'Pin Code',
          type: 'text',
          validation: {
            required: 'Please enter pin code',
            pattern: { value: ctx.digitsPattern, message: 'Pin code should contain digits only' },
          },
        },
        {
          name: 'company.corp.email',
          label: 'Email ID',
          type: 'email',
          validation: {
            required: 'Please enter email id',
            pattern: { value: ctx.emailPattern, message: 'Please enter a valid email' },
          },
        },
        {
          name: 'company.corp.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              {(() => {
                ctx.setFormMethodsRef(methods);
                return null;
              })()}
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-2/5 pr-2">
                  Country Code <span className="text-red-600">*</span>
                </span>
                <span className="w-3/5 pl-2">
                  Mobile Number <span className="text-red-600">*</span>
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  {...methods.register('company.corp.country_code', {
                    required: 'Please select country code',
                    pattern: { value: ctx.digitsPattern, message: 'Country code should contain digits only' },
                  })}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('company.corp.mobile', {
                    required: 'Please enter mobile number',
                    pattern: { value: ctx.digitsPattern, message: 'Mobile number should contain digits only' },
                    minLength: { value: 6, message: 'Mobile number must be at least 6 digits' },
                    maxLength: { value: 16, message: 'Mobile number must be at most 16 digits' },
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-3/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
        {
          name: 'company.corp.phone_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-1/3 pr-2">STD Code</span>
                <span className="w-2/3 pl-2">Phone Number</span>
              </div>
              <div className="flex gap-2">
                <input
                  {...methods.register('company.corp.std_code', {
                    validate: ctx.validateOptionalDigits(1, 6, 'STD code'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-1/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...methods.register('company.corp.phone', {
                    validate: ctx.validateOptionalDigits(3, 10, 'Phone number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-2/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'correspondence-flag',
      title: 'Correspondence Address',
      columns: 1,
      fields: [
        {
          name: 'company.corr_same_as_corp',
          label: 'Correspondence address and corporate address is same',
          type: 'checkbox',
        },
      ],
    },
    {
      id: 'correspondence-address',
      title: 'Correspondence Address',
      columns: 3,
      dependsOn: { field: 'company.corr_same_as_corp', value: true, show: false },
      fields: [
        {
          name: 'company.corr.country',
          label: 'Country',
          type: 'select',
          options: ctx.countries || [],
          searchable: true,
          onChange: (value, methods) => {
            ctx.setCorrCountryId(value);
            ctx.setCorrStateId(undefined);
            ctx.setCorrDistrictId(undefined);
            methods.setValue('company.corr.state', '');
            methods.setValue('company.corr.district', '');
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.state',
          label: 'State',
          type: 'select',
          options: ctx.corrStates || [],
          searchable: true,
          onChange: (value, methods) => {
            ctx.setCorrStateId(value);
            ctx.setCorrDistrictId(undefined);
            methods.setValue('company.corr.district', '');
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.district',
          label: 'District',
          type: 'select',
          options: ctx.corrDistrictOptions,
          searchable: true,
          onChange: (value, methods) => {
            ctx.setCorrDistrictId(value);
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.block',
          label: 'Block',
          type: 'select',
          options: ctx.corrTehsilOptions,
          searchable: true,
        },
        { name: 'company.corr.city', label: 'City', type: 'text' },
        { name: 'company.corr.address1', label: 'Address Line 1', type: 'text' },
        { name: 'company.corr.address2', label: 'Address Line 2', type: 'text' },
        {
          name: 'company.corr.pincode',
          label: 'Pin Code',
          type: 'text',
          validation: { pattern: { value: ctx.digitsPattern, message: 'Pin code should contain digits only' } },
        },
        {
          name: 'company.corr.email',
          label: 'Email ID',
          type: 'email',
          validation: { validate: ctx.validateOptionalEmail },
        },
        {
          name: 'company.corr.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-2/5 pr-2">Country Code</span>
                <span className="w-3/5 pl-2">Mobile Number</span>
              </div>
              <div className="flex gap-2">
                <select
                  {...methods.register('company.corr.country_code', {
                    validate: ctx.validateOptionalDigits(1, 5, 'Country code'),
                  })}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('company.corr.mobile', {
                    validate: ctx.validateOptionalDigits(6, 16, 'Mobile number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-3/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
        {
          name: 'company.corr.phone_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-1/3 pr-2">STD Code</span>
                <span className="w-2/3 pl-2">Phone Number</span>
              </div>
              <div className="flex gap-2">
                <input
                  {...methods.register('company.corr.std_code', {
                    validate: ctx.validateOptionalDigits(1, 6, 'STD code'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-1/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...methods.register('company.corr.phone', {
                    validate: ctx.validateOptionalDigits(3, 10, 'Phone number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-2/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
      ],
    },
  ],
});
