import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type PaymentContext = {
  setFormMethodsRef: (methods: any) => void;
};

export const buildPaymentStep = (_ctx: PaymentContext): Step => {
  return {
  id: 'step-7',
  title: 'Payment',
  sections: [
    {
      id: 'payment-summary',
      title: 'Payment',
      columns: 1,
      fields: [
        {
          name: 'payment.summary',
          type: 'custom',
          render: () => (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Application No', value: '#004562485' },
                  { label: 'Company Name', value: 'Company Name' },
                  { label: 'Application Category', value: 'General' },
                  { label: 'Project Cost', value: '0' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                  >
                    <div className="text-gray-500">{item.label}</div>
                    <div className="font-semibold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-700 text-white">
                    <tr>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Total Paid Till Date</th>
                      <th className="px-4 py-3">Payable Amount</th>
                      <th className="px-4 py-3">Tax</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3">Department Name</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button type="button" className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white">
                  Pay Using PayGov
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-700 text-white">
                    <tr>
                      <th className="px-4 py-3">Sl. No</th>
                      <th className="px-4 py-3">Payment Mode</th>
                      <th className="px-4 py-3">UTR/Bank Transaction Number</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date of Payment</th>
                      <th className="px-4 py-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3">1</td>
                      <td className="px-4 py-3">Pay Using PayGov</td>
                      <td className="px-4 py-3">--</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">--</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-green-500 px-2 py-1 text-xs text-green-600">
                          Success
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
      ],
    },
  ],
};
};
