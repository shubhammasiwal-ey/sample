'use client';

import { useState } from 'react';

type Option = { label: string; value: string };

export default function ProjectStatusPage() {
  const cafOptions: Option[] = [
    { label: 'ABC Private Limited - 55389', value: '55389' },
    { label: 'XYZ Infra Pvt. Ltd - 66421', value: '66421' },
  ];

  const statusOptions: Option[] = [
    { label: 'Implemented', value: 'Implemented' },
    { label: 'Under Implementation', value: 'Under Implementation' },
    { label: 'Dropped', value: 'Dropped' },
  ];

  const [formData, setFormData] = useState({
    caf: '',
    lastApprovalStatus: '',
    trialProduction: '',
    categoryA: '',
    categoryB: '',
    categoryC: '',
    categoryD: '',
    male: '',
    female: '',
    others: '',
    totalEmployment: '',
    commercialCommencementDate: '',
    landType: '',
    landAllotmentStage: '',
    projectStatus: '',
    currentStatus: '',
    notImplementationReason: '',
    droppedWithdrawnRemarks: '',
    remarks: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-6 pb-3 border-b flex items-center gap-2">
          <span className="text-[#e9090c] text-xl">●</span>
          Project Status Update
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
              <label className="block mb-1 font-semibold">CAF</label>
              <select
                name="caf"
                value={formData.caf}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
              >
                <option value="">Select CAF...</option>
                {cafOptions.map((caf) => (
                  <option key={caf.value} value={caf.value}>
                    {caf.label}
                  </option>
                ))}
              </select>
              </div>

              <div>
              <label className="block mb-1 font-semibold">Status of the Last Approval</label>
              <select
                name="lastApprovalStatus"
                value={formData.lastApprovalStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
              >
                <option value="">Select...</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              </div>
            </div>

            {formData.lastApprovalStatus !== 'Under Implementation' && formData.lastApprovalStatus !== 'Dropped' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Brief on Trial/Commercial Production</label>
                    <textarea
                      name="trialProduction"
                      value={formData.trialProduction}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                      rows={6}
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Category-wise Employment</h4>
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                      <table className="min-w-full bg-white">
                        <thead className="bg-[#f8f8f8]">
                          <tr>
                            <th className="px-4 py-3 border text-left">Category</th>
                            <th className="px-4 py-3 border text-left">Total Employees</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3 border">Category A</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryA"
                                value={formData.categoryA}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category B</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryB"
                                value={formData.categoryB}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category C</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryC"
                                value={formData.categoryC}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category D</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryD"
                                value={formData.categoryD}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold mb-3">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold">Male</label>
                      <input
                        type="text"
                        name="male"
                        value={formData.male}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Female</label>
                      <input
                        type="text"
                        name="female"
                        value={formData.female}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Others</label>
                      <input
                        type="text"
                        name="others"
                        value={formData.others}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Total Employment</label>
                      <input
                        type="text"
                        name="totalEmployment"
                        value={formData.totalEmployment}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Date of Commercial Commencement</label>
                    <input
                      type="date"
                      name="commercialCommencementDate"
                      value={formData.commercialCommencementDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.lastApprovalStatus === 'Under Implementation' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Land Type</label>
                    <select
                      name="landType"
                      value={formData.landType}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select Land Type</option>
                      <option value="SIIDCUL land">SIIDCUL land</option>
                      <option value="Own Land">Own Land</option>
                      <option value="Lease Land">Lease Land</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                {formData.landType === 'SIIDCUL land' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1 font-semibold">Land Allotment Stage</label>
                      <select
                        name="landAllotmentStage"
                        value={formData.landAllotmentStage}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                      >
                        <option value="">Select Allotment Stage</option>
                        <option value="Initial Stage">Initial Stage</option>
                        <option value="Allotment Letter">Allotment Letter</option>
                        <option value="Confirmatory letter">Confirmatory letter</option>
                        <option value="Possession Certificate">Possession Certificate</option>
                        <option value="Lease Cum Sale Deed">Lease Cum Sale Deed</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Project status</label>
                    <select
                      name="projectStatus"
                      value={formData.projectStatus}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select Status</option>
                      <option value="Building Plan Approval">Building Plan Approval</option>
                      <option value="Plinth Inspection">Plinth Inspection</option>
                      <option value="Commencement Certificate">Commencement Certificate</option>
                      <option value="Completion Certificate">Completion Certificate</option>
                      <option value="CFE">CFE</option>
                      <option value="CFO">CFO</option>
                      <option value="EC (Environment Clearnce)">EC (Environment Clearnce)</option>
                      <option value="Fire NOC">Fire NOC</option>
                      <option value="Water Connection Obtained">Water Connection Obtained</option>
                      <option value="Power Connection Obtained">Power Connection Obtained</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {(formData.landType === 'Own Land' || formData.landType === 'Lease Land') && (
                    <div>
                      <label className="block mb-1 font-semibold">Current Status</label>
                      <select
                        name="currentStatus"
                        value={formData.currentStatus}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                      >
                        <option value="">Select Status</option>
                        <option value="Construction Stage">Construction Stage</option>
                        <option value="Plant & Machinery Installation stage">Plant & Machinery Installation stage</option>
                        <option value="Operational Stage / Trial Production">Operational Stage / Trial Production</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.lastApprovalStatus === 'Dropped' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Not Implementation Reason</label>
                    <select
                      name="notImplementationReason"
                      value={formData.notImplementationReason}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select a reason</option>
                      <option value="Dropped by Investor">Dropped by Investor</option>
                      <option value="Withdrawn by the Government">Withdrawn by the Government</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Brief remarks on Dropped or Withdrawn</label>
                  <textarea
                    name="droppedWithdrawnRemarks"
                    value={formData.droppedWithdrawnRemarks}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Remarks/Comments (If Any)</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    rows={4}
                  />
                </div>
              </>
            )}

            {formData.lastApprovalStatus !== 'Dropped' && (
              <div className="md:col-span-2">
                <label className="block mb-1 font-semibold">Remarks/Comments (If Any)</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                  rows={4}
                />
              </div>
            )}

            <div className="text-right">
              <button
                type="button"
                className="bg-[#e9090c] hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md shadow-md transition-all"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
