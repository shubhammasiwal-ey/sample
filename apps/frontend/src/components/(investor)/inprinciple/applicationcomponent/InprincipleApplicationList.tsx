'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

type AccordionItem = {
  id: number;
  title: string;
  status: string;
  statusClass: string;
  statusCode: string;
  submissionId: number;
  cafId: string;
  projectCategory: string;
  projectType: string;
  investment: string;
  unitName: string;
  pollutionCategory: string;
  revertedCallBackUrl?: string | null;
  printAppCallBackUrl?: string | null;
  downloadCertificateCallBackUrl?: string | null;
};

type ApplicationApiRow = {
  submissionId: number;
  status: string;
  ubuId: string | null;
  unitName: string;
  projectCategory: string;
  projectType: string;
  investment: string;
  pollutionCategory: string;
  revertedCallBackUrl?: string | null;
  printAppCallBackUrl?: string | null;
  downloadCertificateCallBackUrl?: string | null;
};

type InprincipleApplicationListProps = {
  serviceId?: string;
  onCountChange?: (count: number) => void;
};

export default function InprincipleApplicationList({
  serviceId = '943.0',
  onCountChange,
}: InprincipleApplicationListProps) {
  const { user, loading } = useAuth();
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [deptOpen, setDeptOpen] = useState(false);
  const [applications, setApplications] = useState<AccordionItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      if (loading || !user?.id) {
        return;
      }
      try {
        const res = await apiClient.get<ApplicationApiRow[]>(
          `/investor/inprinciple/applications?serviceId=${serviceId}`,
        );
        const statusMap: Record<string, { label: string; className: string }> = {
          A: { label: 'Approved', className: 'bg-green-100 text-green-700' },
          I: { label: 'Incomplete', className: 'bg-yellow-100 text-yellow-700' },
          P: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
          R: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
          RBI: { label: 'Revert Back', className: 'bg-orange-100 text-orange-700' },
          DP: { label: 'Document Pending', className: 'bg-orange-100 text-orange-700' },
          PD: { label: 'Payment Due', className: 'bg-orange-100 text-orange-700' },
        };

        const items = (res.data || []).map((item, index) => {
          const statusCode = String(item.status || '').trim().toUpperCase();
          const statusInfo = statusMap[statusCode] || {
            label: statusCode || 'N/A',
            className: 'bg-gray-100 text-gray-700',
          };
          return {
            id: index,
            submissionId: item.submissionId,
            title: `Single Business ID - ${item.ubuId || 'Currently not generated'}`,
            status: statusInfo.label,
            statusClass: statusInfo.className,
            statusCode,
            cafId: String(item.submissionId || ''),
            projectCategory: item.projectCategory || 'N/A',
            projectType: item.projectType || 'N/A',
            investment: item.investment || 'N/A',
            unitName: item.unitName || 'N/A',
            pollutionCategory: item.pollutionCategory || 'N/A',
            revertedCallBackUrl: item.revertedCallBackUrl,
            printAppCallBackUrl: item.printAppCallBackUrl,
            downloadCertificateCallBackUrl: item.downloadCertificateCallBackUrl,
          } as AccordionItem;
        });
        setApplications(items);
        onCountChange?.(items.length);
        if (items.length && openAccordion === null) {
          setOpenAccordion(0);
        }
      } catch (error) {
        console.error('Failed to load applications', error);
      }
    };
    fetchApplications();
  }, [serviceId, onCountChange, loading, user?.id]);

  const toggleAccordion = (id: number) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const encodeParam = (value: string | number) => String(value);

  const openUrl = (url?: string | null) => {
    if (!url) return;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {applications.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No applications yet. Click "Add Project" to start a new application.
        </div>
      )}
      {applications.map((item) => (
        <div key={item.id} className="accordion-item rounded-[20px] border border-gray-200 bg-white overflow-hidden">
          <button
            className={`accordion-header flex w-full items-center justify-between px-6 py-3 text-left rounded-[20px] ${openAccordion === item.id ? 'rounded-b-none' : ''}`}
            onClick={() => toggleAccordion(item.id)}
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium ${item.statusClass}`}>
                <img src="/investor/icons/tick.svg" alt="" />
                {item.status}
              </span>
              <img src="/investor/icons/arrow-down.svg" alt="" className={openAccordion === item.id ? 'rotate-180' : ''} />
            </div>
          </button>

          {openAccordion === item.id && (
            <div className="accordion-content px-6 pb-6 rounded-b-[20px]">
              <div className="rounded-[20px] bg-white p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-10 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">CAF ID</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{item.cafId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Project Category</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{item.projectCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Project Type</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{item.projectType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Investment in Plant and Machinary</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {item.investment && item.investment !== 'N/A'
                        ? `INR ${item.investment} cr`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Name</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{item.unitName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pollution Category</p>
                    <p className="mt-1 text-base font-semibold text-green-600">{item.pollutionCategory}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 my-10">
                  {(() => {
                    const status = item.statusCode;
                    const editStatuses = ['I', 'DP', 'PD', 'RBI'];
                    const approvedCode = status === 'A';
                    const actions = [
                      ...(editStatuses.includes(status)
                        ? [
                            {
                              label: 'Edit',
                              iconDefault: '/investor/icons/amendment-default.svg',
                              iconActive: '/investor/icons/amendment-active.svg',
                              onClick: () => openUrl(item.revertedCallBackUrl || ''),
                            },
                          ]
                        : []),
                      {
                        label: 'View Application',
                        iconDefault: '/investor/icons/eye-default.svg',
                        iconActive: '/investor/icons/eye-active.svg',
                        onClick: () => openUrl(item.printAppCallBackUrl || ''),
                      },
                      {
                        label: 'Activity Log',
                        iconDefault: '/investor/icons/log-default.svg',
                        iconActive: '/investor/icons/log-active.svg',
                        onClick: () =>
                          openUrl(`/investor/inprinciple/history?submissionId=${encodeParam(item.submissionId)}`),
                      },
                      {
                        label: 'Documents',
                        iconDefault: '/investor/icons/document-default.svg',
                        iconActive: '/investor/icons/document-active.svg',
                        onClick: () =>
                          openUrl(`/investor/inprinciple/documents?submissionId=${encodeParam(item.submissionId)}`),
                      },
                      ...(approvedCode
                        ? [
                            {
                              label: 'View Certificate',
                              iconDefault: '/investor/icons/document-default.svg',
                              iconActive: '/investor/icons/document-active.svg',
                              onClick: () => openUrl(item.downloadCertificateCallBackUrl || ''),
                            },
                            {
                              label: 'Amendment',
                              iconDefault: '/investor/icons/amendment-default.svg',
                              iconActive: '/investor/icons/amendment-active.svg',
                              onClick: () => openUrl(`/investor/inprinciple/amendment?submissionId=${item.submissionId}`),
                            },
                            {
                              label: 'Submit Feedback',
                              iconDefault: '/investor/icons/revert-query-default.svg',
                              iconActive: '/investor/icons/revert-query-active.svg',
                              onClick: () => openUrl(`/investor/inprinciple/feedback?submissionId=${item.submissionId}`),
                            },
                          ]
                        : []),
                    ];

                    return actions.map((action) => (
                      <button
                        key={action.label}
                        className="action-pill group flex items-center gap-2 rounded-full bg-gray px-4 py-3 text-gray-600 hover:text-white transition-all duration-300"
                        onClick={action.onClick}
                      >
                        <span className="action-icon hidden group-hover:block">
                          <img src={action.iconActive} alt="" />
                        </span>
                        <span className="action-icon block group-hover:hidden">
                          <img src={action.iconDefault} alt="" />
                        </span>
                        <span className="action-label max-w-0 overflow-hidden whitespace-nowrap text-sm opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100">
                          {action.label}
                        </span>
                      </button>
                    ));
                  })()}
                </div>

                <div className="my-6 h-px bg-gray-200"></div>

                <div className="mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Project Services</h3>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDeptOpen((prev) => !prev)}
                        className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        All Departmental Service
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {deptOpen && (
                        <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
                          <ul className="py-2 text-sm text-gray-700">
                            {[
                              'All Departmental Service',
                              'Industry Department',
                              'Pollution Control Board',
                              'Power Department',
                              'Labour Department',
                            ].map((label) => (
                              <li key={label}>
                                <button className="w-full px-4 py-2 text-left hover:bg-gray-50">{label}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-[20px] bg-[#EEF8FE] p-5 border border-[#C4D7E3]">
                        <p className="text-sm text-gray-700">Applied</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-3xl font-semibold">4</span>
                          <a href="#">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.6667 11L22.6667 16M22.6667 16L17.6667 21M22.6667 16H9.33333M31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16C1 7.71567 7.71573 1 16 1C24.2843 1 31 7.71567 31 16Z" stroke="#7EA7C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="rounded-[20px] bg-[#F6FDF6] p-5 border border-[#CFEFCF]">
                        <p className="text-sm text-gray-700">Approved</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-3xl font-semibold">1</span>
                          <a href="#">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.6667 11L22.6667 16M22.6667 16L17.6667 21M22.6667 16H9.33333M31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16C1 7.71567 7.71573 1 16 1C24.2843 1 31 7.71567 31 16Z" stroke="#A2C6A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="rounded-[20px] bg-[#FDF6F6] p-5 border border-[#EBC6C6]">
                        <p className="text-sm text-gray-700">Rejected</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-3xl font-semibold">0</span>
                          <a href="#">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.6667 11L22.6667 16M22.6667 16L17.6667 21M22.6667 16H9.33333M31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16C1 7.71567 7.71573 1 16 1C24.2843 1 31 7.71567 31 16Z" stroke="#C6A2A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="rounded-[20px] bg-[#FFF9ED] p-5 border border-[#E7D9B8]">
                        <p className="text-sm text-gray-700">Inprogress</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-3xl font-semibold">1</span>
                          <a href="#">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.6667 11L22.6667 16M22.6667 16L17.6667 21M22.6667 16H9.33333M31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16C1 7.71567 7.71573 1 16 1C24.2843 1 31 7.71567 31 16Z" stroke="#C9B88A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-gray-200 bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-semibold text-gray-900">10</span>
                          <span className="text-sm text-gray-500">Applications</span>
                        </div>
                        <span className="rounded-full bg-[#EFF6FF] px-4 py-1 text-sm font-semibold text-[#2563EB]">Total</span>
                      </div>
                      <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[60%] rounded-full bg-blue-500"></div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <span>Target</span>
                        <span className="font-medium">60%</span>
                      </div>
                      <div className="relative mt-6 rounded-xl bg-[#F8FAFC] px-4 py-3">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
                          <span className="rounded-full bg-primary px-3 py-1">AAA</span>
                        </div>
                        <p className="text-sm text-gray-600 pt-4">Average Approval Authority</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
