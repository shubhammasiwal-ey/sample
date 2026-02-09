import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type SummaryContext = {
  setFormMethodsRef: (methods: any) => void;
};

export const buildSummaryStep = (_ctx: SummaryContext): Step => ({
  id: 'step-9',
  title: 'Summary',
  sections: [
    {
      id: 'summary',
      title: 'Summary',
      columns: 1,
      fields: [
        {
          name: 'summary.table',
          type: 'custom',
          render: () => (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="px-4 py-3">Sl. No</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">View</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Company Details',
                    'Authorized and Promoter details',
                    'Proposed Project Details',
                    'Project Finance',
                    'Project Requirement',
                    'Supporting Documents',
                    'Payment',
                    'Application Signing',
                    'Summary',
                  ].map((label, index) => (
                    <tr key={label} className="border-t border-gray-200">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{label}</td>
                      <td className="px-4 py-3 text-green-600">OK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
      ],
    },
  ],
});
