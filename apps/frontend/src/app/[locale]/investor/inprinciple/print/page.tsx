'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';

type DraftResponse = {
  submissionId: number;
  formData: any;
  unitName?: string;
};

export default function InprinciplePrintPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ submissionId?: string }> }) {
  const resolvedSearchParams = React.use(searchParams);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeParam = (value?: string | null) => {
    if (!value) return '';
    return value;
  };

  useEffect(() => {
    const submissionToken = resolvedSearchParams?.submissionId;
    const decoded = decodeParam(submissionToken);
    const parsedId = Number(decoded);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      setLoading(false);
      return;
    }

    const loadDraft = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/draft', {
          params: { submissionId: parsedId },
        });
        setDraft(res?.data || null);
      } catch (error) {
        console.error('Failed to load draft for print', error);
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [searchParams]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading application...</div>;
  }

  if (!draft) {
    return <div className="p-6 text-sm text-gray-600">Application not found.</div>;
  }

  const data = draft.formData || {};
  const company = data.company || {};
  const finance = data.finance || {};
  const requirement = data.requirement || {};
  const land = requirement.land || {};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">In-Principle Application</h1>
          <p className="text-sm text-gray-500">CAF ID: {draft.submissionId}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Print
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Unit Name</p>
            <p className="text-sm font-semibold text-gray-900">{company.name || draft.unitName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Project Type</p>
            <p className="text-sm font-semibold text-gray-900">{company.primary_activity || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Project Category</p>
            <p className="text-sm font-semibold text-gray-900">{finance.project_category || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Investment (Plant & Machinery)</p>
            <p className="text-sm font-semibold text-gray-900">
              {finance?.cost?.plant ? String(finance.cost.plant) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">District</p>
            <p className="text-sm font-semibold text-gray-900">{land.district || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Khasra / Survey</p>
            <p className="text-sm font-semibold text-gray-900">
              {[land.land_code, land.survey_no].filter(Boolean).join(' / ') || 'N/A'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Corporate Address</h2>
          <p className="text-sm text-gray-700">
            {[company?.corp?.address1, company?.corp?.city, company?.corp?.block, company?.corp?.district]
              .filter(Boolean)
              .join(', ') || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
