'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { CgFileDocument } from 'react-icons/cg';

const stageNames: Record<string, string> = {
    'Pre establishment': 'Pre-establishment',
    'Operational': 'Operational',
    'Post operational': 'Post-operational',
};

export default function KyaApprovalsPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const searchParams = useSearchParams();

    const [openStage, setOpenStage] = useState<string | null>('Operational');
    const [approvals, setApprovals] = useState<any[]>([]);
    const [timeline, setTimeline] = useState('');
    const [referenceId, setReferenceId] = useState('KYA-GUEST-001');
    const [loading, setLoading] = useState(false);

    // Decode service IDs from URL
    const approvalIds = useMemo(() => {
        const encoded = searchParams.get('data');
        try {
            return encoded ? JSON.parse(encoded) : [];
        } catch {
            return [];
        }
    }, [searchParams]);

    useEffect(() => {
        if (!approvalIds || approvalIds.length === 0) return;

        const now = new Date();
        const formattedTimestamp =
            now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-GB');
        setTimeline(formattedTimestamp);

        async function fetchData() {
            setLoading(true);
            try {
                const serviceUrl = `${API_URL}/kya/service-details/byids`;
                const payload = { service_ids: approvalIds };

                const res = await fetch(serviceUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error('Failed to fetch services');

                const data = await res.json();
                setApprovals(data);
            } catch (err) {
                console.error('API Error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [approvalIds, API_URL]);

    const groupedApprovals = useMemo(() => {
        return approvals.reduce((acc, currentItem) => {
            const stageStr = currentItem.service_category || 'Unknown';
            if (!acc[stageStr]) acc[stageStr] = [];
            acc[stageStr].push(currentItem);
            return acc;
        }, {} as Record<string, typeof approvals>);
    }, [approvals]);

    const sortedStages = Object.keys(groupedApprovals).sort(
        (a, b) => Number(b) - Number(a)
    );

    const handleToggle = (stage: string) => {
        setOpenStage((prev) => (prev === stage ? null : stage));
    };

    const handleDownload = () => {
        console.log('Download approvals:', sortedStages);
        // TODO: Implement PDF download functionality
    };

    const openDocument = (documentPath: string | null) => {
        if (!documentPath) return;
        const fileUrl = `${process.env.NEXT_PUBLIC_INDUSTRY_SERVICES_FILE?.replace(/\/$/, '')}/${documentPath.split('\\').pop()}`;
        window.open(fileUrl, '_blank');
    };

    if (loading && approvals.length === 0) {
        return (
            <div style={{ paddingTop: '150px' }}>
                <div className="text-center text-muted">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading approvals...</span>
                    </div>
                    <p className="mt-3">Loading approvals...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '150px', paddingBottom: '80px' }}>
            <div className="container-fluid px-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h2 fw-bold text-dark mb-2">
                                    <i className="bi bi-check2-circle text-success me-2"></i>
                                    Your Required Approvals
                                </h1>
                                <p className="text-muted mb-0">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Based on your answers to the KYA questionnaire
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="btn btn-outline-primary d-flex align-items-center gap-2"
                            >
                                <Download size={20} />
                                <span className="d-none d-md-inline">Download PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Disclaimer - Moved to Top */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-warning border-warning shadow-sm" role="alert">
                            <div className="d-flex gap-3">
                                <div className="flex-shrink-0">
                                    <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="alert-heading fw-bold mb-2">
                                        <i className="bi bi-shield-exclamation me-2"></i>
                                        Disclaimer
                                    </h5>
                                    <p className="mb-2 small">
                                        This search result, generated from the{' '}
                                        <strong className="text-dark">Know Your Approvals (KYA)</strong> module on{' '}
                                        <strong className="text-dark">{timeline}</strong>
                                        {' '}(KYA Reference ID: <span className="badge bg-warning text-dark">{referenceId}</span>),
                                        reflects the indicative list of applicable approvals and compliances as per the
                                        notified laws and regulations of the Government of{' '}
                                        <strong>{process.env.NEXT_PUBLIC_STATE_NAME || 'Jharkhand'}</strong>, based on
                                        the information provided by the applicant.
                                    </p>
                                    <hr className="my-2" />
                                    <p className="mb-0 small text-dark">
                                        <i className="bi bi-info-circle-fill me-1"></i>
                                        <em>This is an indicative list and may vary based on specific project requirements and regulatory updates.</em>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approvals Summary Cards */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm bg-light">
                            <div className="card-body">
                                <div className="row g-3 text-center">
                                    <div className="col-md-4">
                                        <div className="p-3 bg-white rounded">
                                            <h3 className="text-primary mb-1 fw-bold">{approvals.length}</h3>
                                            <p className="text-muted mb-0 small">Total Approvals Required</p>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="p-3 bg-white rounded">
                                            <h3 className="text-success mb-1 fw-bold">{sortedStages.length}</h3>
                                            <p className="text-muted mb-0 small">Stage Categories</p>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="p-3 bg-white rounded">
                                            <h3 className="text-info mb-1 fw-bold">
                                                {Math.max(...approvals.map(a => a.timeline || 0))}
                                            </h3>
                                            <p className="text-muted mb-0 small">Max Timeline (Days)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accordion Stages */}
                <div className="row">
                    <div className="col-12">
                        {sortedStages.map((stage, idx) => {
                            const isOpen = openStage === stage;
                            const stageItems = groupedApprovals[stage];

                            return (
                                <div key={stage} className="card border-0 shadow-sm mb-3">
                                    {/* Accordion Header */}
                                    <div
                                        className={`card-header border-0 ${isOpen ? 'bg-primary text-white' : 'bg-light'
                                            }`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggle(stage)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center py-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <span className={`badge ${isOpen ? 'bg-white text-primary' : 'bg-primary'
                                                    } fs-6 px-3 py-2`}>
                                                    {idx + 1}
                                                </span>
                                                <h5 className="mb-0 fw-bold">
                                                    {stageNames[stage] || stage}
                                                </h5>
                                                <span className={`badge ${isOpen ? 'bg-white text-primary' : 'bg-primary bg-opacity-10 text-primary'
                                                    }`}>
                                                    {stageItems.length} {stageItems.length === 1 ? 'Approval' : 'Approvals'}
                                                </span>
                                            </div>
                                            <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} fs-5`}></i>
                                        </div>
                                    </div>

                                    {/* Accordion Body */}
                                    {isOpen && (
                                        <div className="card-body p-0">
                                            <div className="table-responsive">
                                                <table className="table table-hover mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="fw-semibold" style={{ width: '50px' }}>S.NO</th>
                                                            <th className="fw-semibold">APPROVAL NAME</th>
                                                            <th className="fw-semibold text-center" style={{ width: '120px' }}>
                                                                STATE/CENTRAL
                                                            </th>
                                                            <th className="fw-semibold text-center" style={{ width: '100px' }}>SOP</th>
                                                            <th className="fw-semibold text-center" style={{ width: '120px' }}>
                                                                FEE DETAILS
                                                            </th>
                                                            <th className="fw-semibold text-center" style={{ width: '100px' }}>
                                                                TIMELINE
                                                            </th>
                                                            <th className="fw-semibold text-center" style={{ width: '150px' }}>
                                                                LIST OF DOCUMENTS
                                                            </th>
                                                            <th className="fw-semibold text-center" style={{ width: '100px' }}>
                                                                ACTION
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stageItems.map((item: any, index: number) => (
                                                            <tr key={item.id}>
                                                                <td className="text-muted align-middle">{index + 1}</td>
                                                                <td className="fw-medium align-middle">{item.service_name}</td>
                                                                <td className="align-middle text-center">
                                                                    <span className={`badge ${item.is_central_govt_service === 'Y'
                                                                        ? 'bg-primary'
                                                                        : 'bg-success'
                                                                        }`}>
                                                                        {item.is_central_govt_service === 'Y' ? 'Central' : 'State'}
                                                                    </span>
                                                                </td>
                                                                <td className="align-middle text-center">
                                                                    {item.sop_document ? (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => openDocument(item.sop_document)}
                                                                        >
                                                                            <CgFileDocument size={18} />
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-muted small">NA</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-middle text-center">
                                                                    {item.fee_structure_document ? (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => openDocument(item.fee_structure_document)}
                                                                        >
                                                                            <CgFileDocument size={18} />
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-muted small">NA</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-middle text-center">
                                                                    {item.timeline ? (
                                                                        <span className="badge bg-info text-dark">
                                                                            {item.timeline} Days
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted small">NA</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-middle text-center">
                                                                    {item.list_of_required_documents ? (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => openDocument(item.list_of_required_documents)}
                                                                        >
                                                                            <CgFileDocument size={18} />
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-muted small">NA</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-middle text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => {
                                                                            console.log('Apply for:', item.service_name);
                                                                        }}
                                                                    >
                                                                        Apply
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {stageItems.length === 0 && (
                                                    <div className="p-5 text-center text-muted">
                                                        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                                                        <p className="mb-0">No approval items found for this stage.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
