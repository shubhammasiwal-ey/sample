import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type ProjectFinanceContext = {
  digitsPattern: RegExp;
  getFieldError: (methods: any, name: string) => string | undefined;
  computeFinanceDerived: (methods: any) => void;
  computeFinanceMeansTotal: (methods: any) => void;
};

export const buildProjectFinanceStep = (ctx: ProjectFinanceContext): Step => {
  const {
    digitsPattern,
    getFieldError,
    computeFinanceDerived,
    computeFinanceMeansTotal,
  } = ctx;

  return {
  id: 'step-4',
  title: 'Project Finance',
  sections: [
    {
      id: 'project-cost',
      title: 'Proposed Cost of the Project (Rs in Crores)',
      columns: 3,
        fields: [
        {
          name: 'finance.cost.vfa_tag',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => (
            <div className="mb-2">
              <span className="inline-block rounded-md bg-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                VFA
              </span>
            </div>
          ),
        },
        {
          name: 'finance.cost.land',
          label: 'Land',
          type: 'text',
          validation: {
            required: 'Please enter land cost',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Land should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.building',
          label: 'Building',
          type: 'text',
          validation: {
            required: 'Please enter building cost',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Building should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.plant',
          label: 'Plant & Machinery',
          type: 'text',
          validation: {
            required: 'Please enter plant & machinery cost',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Plant & Machinery should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.other_tag',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => (
            <div className="mb-2 mt-2">
              <span className="inline-block rounded-md bg-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-800">
                Other Investment
              </span>
            </div>
          ),
        },
        {
          name: 'finance.cost.working_capital',
          label: 'Work Capital Margin',
          type: 'text',
          validation: {
            required: 'Please enter working capital margin',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Working Capital should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.contingency',
          label: 'Contingency',
          type: 'text',
          validation: {
            required: 'Please enter contingency',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Contingency should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.others',
          label: 'Others',
          type: 'text',
          validation: {
            required: 'Please enter others',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Others should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceDerived(methods);
          },
        },
        {
          name: 'finance.cost.total',
          label: 'Total',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={methods.watch('finance.cost.total') || ''}
                className="w-full px-3 py-2.5 border rounded text-sm bg-gray-100 border-gray-300"
              />
            </div>
          ),
        },
        {
          name: 'finance.project_category',
          label: 'Project Category',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Category <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={methods.watch('finance.project_category') || ''}
                className="w-full px-3 py-2.5 border rounded text-sm bg-gray-100 border-gray-300"
              />
            </div>
          ),
        },
        {
          name: 'finance.cost.total_spacer',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: () => <div className="h-0" />,
        },
      ],
    },
    {
      id: 'means-of-finance',
      title: 'Means of Finance (Rs in Crores)',
      columns: 3,
        fields: [
        {
          name: 'finance.means.promoter_equity',
          label: 'Promoter\'s Equity',
          type: 'text',
          validation: {
            required: 'Please enter promoter equity',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Promoter\'s Equity should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceMeansTotal(methods);
          },
        },
        {
          name: 'finance.means.institution_equity',
          label: 'Institution\'s Equity',
          type: 'text',
          validation: {
            required: 'Please enter institution equity',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Institution\'s Equity should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceMeansTotal(methods);
          },
        },
        {
          name: 'finance.means.foreign_equity',
          label: 'Foreign Equity',
          type: 'text',
          validation: {
            required: 'Please enter foreign equity',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Foreign Equity should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceMeansTotal(methods);
          },
        },
        {
          name: 'finance.means.term_loans',
          label: 'Term Loans',
          type: 'text',
          validation: {
            required: 'Please enter term loans',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Term Loans should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceMeansTotal(methods);
          },
        },
        {
          name: 'finance.means.others',
          label: 'Others',
          type: 'text',
          validation: {
            required: 'Please enter others',
            pattern: { value: /^\d+(\.\d+)?$/, message: 'Others should be numeric' },
          },
          onChange: (_value, methods) => {
            computeFinanceMeansTotal(methods);
          },
        },
        {
          name: 'finance.means.total',
          label: 'Total',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={methods.watch('finance.means.total') || ''}
                className="w-full px-3 py-2.5 border rounded text-sm bg-gray-100 border-gray-300"
              />
            </div>
          ),
        },
        {
          name: 'finance.means.total_spacer',
          label: '',
          type: 'custom',
          colSpan: 2,
          render: () => <div className="h-0" />,
        },
      ],
    },
    {
      id: 'finance-flags',
      title: 'Finance Flags',
      columns: 2,
      fields: [
        {
          name: 'finance.ecb_fdi',
          label: 'External Commercial Borrowing (ECB) / FDI',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'finance.share_details',
          label: 'Share application details with financial institutions?',
          type: 'radio',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
      ],
    },
  ],
};
};
