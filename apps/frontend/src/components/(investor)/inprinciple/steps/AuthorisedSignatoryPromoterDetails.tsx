import type { ReactElement } from 'react';
import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];
type UploadedFileInfo = {
  filePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type AuthorisedSignatoryPromoterDetailsContext = {
  promoters: any[];
  setPromoters: (next: any[]) => void;
  formUploads: Record<string, UploadedFileInfo>;
  setFormUploads: (
    next:
      | Record<string, UploadedFileInfo>
      | ((prev: Record<string, UploadedFileInfo>) => Record<string, UploadedFileInfo>)
  ) => void;
  uploadingFiles: Record<string, boolean>;
  setFileInputResetKey: (value: number | ((prev: number) => number)) => void;
  digitsPattern: RegExp;
  emailPattern: RegExp;
  aadhaarPattern: RegExp;
  validateOptionalDigits: (min: number, max: number, label: string) => (value: string) => true | string;
  renderUploadField: (name: string, label: string, accept: string, requiredMessage: string) => (methods: any) => ReactElement;
  renderFileCell: (fileInfo: UploadedFileInfo | null | undefined, label: string) => ReactElement;
  renderBooleanIcon: (value: string | boolean | null | undefined) => ReactElement;
  formatTextValue: (value: string | null | undefined) => string;
};

export const buildAuthorisedSignatoryPromoterDetailsStep = (
  ctx: AuthorisedSignatoryPromoterDetailsContext
): Step => ({
  id: 'step-2',
  title: 'Authorised Signatory & Promoter Details',
  sections: [
    {
      id: 'promoter-details',
      title: 'Promoter Details',
      columns: 3,
      fields: [
        { name: 'promoter.entries', type: 'hidden' },
        {
          name: 'promoter.foreign_national',
          label: 'Is the Investor a Foreign National?',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          skipStepValidation: true,
          validation: { required: 'Please select an option' },
        },
        {
          name: 'promoter.name',
          label: 'Name',
          type: 'text',
          skipStepValidation: true,
          validation: { required: 'Please enter name' },
        },
        {
          name: 'promoter.aadhaar',
          label: 'Aadhaar No',
          type: 'text',
          skipStepValidation: true,
          validation: {
            required: 'Please enter Aadhaar number',
            pattern: { value: ctx.aadhaarPattern, message: 'Aadhaar must be 12 digits' },
          },
        },
        {
          name: 'promoter.designation',
          label: 'Designation',
          type: 'text',
          skipStepValidation: true,
          validation: { required: 'Please enter designation' },
        },
        {
          name: 'promoter.gender',
          label: 'Gender',
          type: 'select',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ],
          skipStepValidation: true,
          validation: { required: 'Please select gender' },
        },
        {
          name: 'promoter.address',
          label: 'Address',
          type: 'text',
          skipStepValidation: true,
          validation: { required: 'Please enter address' },
        },
        {
          name: 'promoter.phone_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          skipStepValidation: true,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-1/3 pr-2">STD Code</span>
                <span className="w-2/3 pl-2">Phone No. Office</span>
              </div>
              <div className="flex gap-2">
                <input
                  {...methods.register('promoter.std_code', {
                    validate: ctx.validateOptionalDigits(1, 6, 'STD code'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  className="w-1/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...methods.register('promoter.office_phone', {
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
        {
          name: 'promoter.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          skipStepValidation: true,
          render: (methods) => (
            <div>
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
                  {...methods.register('promoter.country_code', {
                    required: 'Please select country code',
                  })}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('promoter.mobile', {
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
          name: 'promoter.category',
          label: 'Category',
          type: 'select',
          options: [
            { label: 'General', value: 'general' },
            { label: 'SC', value: 'sc' },
            { label: 'ST', value: 'st' },
            { label: 'OBC', value: 'obc' },
          ],
          skipStepValidation: true,
          validation: { required: 'Please select category' },
        },
        {
          name: 'promoter.email',
          label: 'Email',
          type: 'email',
          skipStepValidation: true,
          validation: {
            required: 'Please enter email',
            pattern: { value: ctx.emailPattern, message: 'Please enter a valid email' },
          },
        },
        {
          name: 'promoter.net_worth',
          label: 'Net Worth (INR)',
          type: 'text',
          skipStepValidation: true,
          validation: {
            required: 'Please enter net worth',
            pattern: { value: ctx.digitsPattern, message: 'Net worth should be number only' },
          },
        },
        {
          name: 'promoter.experience',
          label: 'Total Experience (in Years)',
          type: 'text',
          skipStepValidation: true,
          validation: {
            required: 'Please enter experience',
            pattern: { value: ctx.digitsPattern, message: 'Experience should be number only' },
          },
        },
        {
          name: 'promoter.dob',
          label: 'Date of Birth',
          type: 'date',
          skipStepValidation: true,
          validation: { required: 'Please select date of birth' },
        },
        {
          name: 'promoter.photo',
          label: '',
          type: 'custom',
          colSpan: 1,
          skipStepValidation: true,
          render: ctx.renderUploadField(
            'promoter.photo',
            'Promoter Photograph',
            '.jpg,.jpeg,.png',
            'Please upload promoter photograph'
          ),
        },
        {
          name: 'promoter.it_return',
          label: '',
          type: 'custom',
          colSpan: 1,
          skipStepValidation: true,
          render: ctx.renderUploadField(
            'promoter.it_return',
            'IT Return of the Last Financial Year',
            '.pdf',
            'Please upload IT return'
          ),
        },
        {
          name: 'promoter.authorized_to_sign',
          label: 'Is this person authorized to sign the application?',
          type: 'checkbox',
          skipStepValidation: true,
        },
        {
          name: 'promoter.entries_table',
          label: '',
          type: 'custom',
          colSpan: 3,
          skipStepValidation: true,
          render: (methods) => {
            const promoterFieldNames = [
              'promoter.foreign_national',
              'promoter.name',
              'promoter.aadhaar',
              'promoter.designation',
              'promoter.gender',
              'promoter.address',
              'promoter.std_code',
              'promoter.office_phone',
              'promoter.country_code',
              'promoter.mobile',
              'promoter.category',
              'promoter.email',
              'promoter.net_worth',
              'promoter.experience',
              'promoter.dob',
              'promoter.photo',
              'promoter.it_return',
              'promoter.authorized_to_sign',
            ];

            const handleAddPromoter = async () => {
              const isValid = await methods.trigger(promoterFieldNames);
              if (!isValid) return;

              if (ctx.uploadingFiles['promoter.photo'] || ctx.uploadingFiles['promoter.it_return']) {
                alert('Please wait for file upload to finish.');
                return;
              }

              const data = methods.getValues('promoter') || {};
              const next = [
                ...ctx.promoters,
                {
                  ...data,
                  photo: ctx.formUploads['promoter.photo'] || null,
                  it_return: ctx.formUploads['promoter.it_return'] || null,
                },
              ];
              ctx.setPromoters(next);
              methods.setValue('promoter.entries', next);

              ctx.setFormUploads((prev) => {
                const nextUploads = { ...prev };
                delete nextUploads['promoter.photo'];
                delete nextUploads['promoter.it_return'];
                return nextUploads;
              });
              ctx.setFileInputResetKey((prev) => prev + 1);

              promoterFieldNames.forEach((fieldName) => {
                if (fieldName.endsWith('authorized_to_sign')) {
                  methods.setValue(fieldName, false);
                } else {
                  methods.setValue(fieldName, '');
                }
              });
            };

            const handleRemovePromoter = (index: number) => {
              const next = ctx.promoters.filter((_, i) => i !== index);
              ctx.setPromoters(next);
              methods.setValue('promoter.entries', next);
            };

            return (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPromoter}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Add More
                  </button>
                </div>

                {ctx.promoters.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-[1200px] w-full text-left text-sm">
                        <thead className="bg-gray-700 text-white">
                          <tr>
                            <th className="px-4 py-3">Foreign National</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Aadhaar No</th>
                            <th className="px-4 py-3">Date of Birth</th>
                            <th className="px-4 py-3">Designation</th>
                            <th className="px-4 py-3">Net Worth (INR)</th>
                            <th className="px-4 py-3">Experience (Years)</th>
                            <th className="px-4 py-3">Gender</th>
                            <th className="px-4 py-3">Address</th>
                            <th className="px-4 py-3">STD/Office Phone</th>
                            <th className="px-4 py-3">Mobile</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Photo</th>
                            <th className="px-4 py-3">IT Return</th>
                            <th className="px-4 py-3">Authorized</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ctx.promoters.map((item, index) => (
                            <tr key={`${item.name}-${index}`} className="border-t border-gray-200">
                              <td className="px-4 py-3">
                                {ctx.renderBooleanIcon(item.foreign_national)}
                              </td>
                              <td className="px-4 py-3">{item.name || '-'}</td>
                              <td className="px-4 py-3">{item.aadhaar || '-'}</td>
                              <td className="px-4 py-3">{item.dob || '-'}</td>
                              <td className="px-4 py-3">{ctx.formatTextValue(item.designation)}</td>
                              <td className="px-4 py-3">{item.net_worth || '-'}</td>
                              <td className="px-4 py-3">{item.experience || '-'}</td>
                              <td className="px-4 py-3">{ctx.formatTextValue(item.gender)}</td>
                              <td className="px-4 py-3">{ctx.formatTextValue(item.address)}</td>
                              <td className="px-4 py-3">
                                {(item.std_code || '-') + ' / ' + (item.office_phone || '-')}
                              </td>
                              <td className="px-4 py-3">
                                {(item.country_code || '') + ' ' + (item.mobile || '')}
                              </td>
                              <td className="px-4 py-3">{ctx.formatTextValue(item.category)}</td>
                              <td className="px-4 py-3">{item.email || '-'}</td>
                              <td className="px-4 py-3">
                                {ctx.renderFileCell(item.photo, 'Promoter Photograph')}
                              </td>
                              <td className="px-4 py-3">
                                {ctx.renderFileCell(item.it_return, 'IT Return')}
                              </td>
                              <td className="px-4 py-3">
                                {ctx.renderBooleanIcon(item.authorized_to_sign)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePromoter(index)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          },
        },
      ],
    },
    {
      id: 'authorized-details',
      title: 'Details of the person authorized to sign the application',
      columns: 3,
      fields: [
        {
          name: 'authorized.foreign_national',
          label: 'Is the Investor a Foreign National?',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        { name: 'authorized.name', label: 'Name', type: 'text', validation: { required: 'Please enter name' } },
        {
          name: 'authorized.aadhaar',
          label: 'Aadhaar No',
          type: 'text',
          validation: {
            required: 'Please enter Aadhaar number',
            pattern: { value: ctx.aadhaarPattern, message: 'Aadhaar must be 12 digits' },
          },
        },
        {
          name: 'authorized.designation',
          label: 'Designation',
          type: 'text',
          validation: { required: 'Please enter designation' },
        },
        {
          name: 'authorized.gender',
          label: 'Gender',
          type: 'select',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ],
          validation: { required: 'Please select gender' },
        },
        { name: 'authorized.address', label: 'Address', type: 'text', validation: { required: 'Please enter address' } },
        {
          name: 'authorized.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
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
                  {...methods.register('authorized.country_code', {
                    required: 'Please select country code',
                  })}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('authorized.mobile', {
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
          name: 'authorized.email',
          label: 'Email',
          type: 'email',
          validation: {
            required: 'Please enter email',
            pattern: { value: ctx.emailPattern, message: 'Please enter a valid email' },
          },
        },
        {
          name: 'authorized.photo',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: ctx.renderUploadField(
            'authorized.photo',
            'Authorized Person Photo',
            '.jpg,.jpeg,.png',
            'Please upload authorized person photo'
          ),
        },
        {
          name: 'authorized.authorization_letter',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: ctx.renderUploadField(
            'authorized.authorization_letter',
            'Authorization Letter',
            '.pdf',
            'Please upload authorization letter'
          ),
        },
      ],
    },
  ],
});
