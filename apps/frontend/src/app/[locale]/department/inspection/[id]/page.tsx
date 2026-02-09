'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCISInspectionDetail, CISInspectionDetail, useRescheduleInspection } from '@/hooks/useInspections';

export default function InspectionDetailPage() {
    const params = useParams();
    const inspectionId = params.id as string;
    const [activeTab, setActiveTab] = useState('overview');

    const { data: inspection, isLoading, error } = useCISInspectionDetail(inspectionId);

    // Reschedule Logic
    const [rescheduleModal, setRescheduleModal] = useState(false);
    const [newDate, setNewDate] = useState('');
    const { mutate: rescheduleInspection, isPending: isRescheduling } = useRescheduleInspection(); // Check hook signature

    const handleReschedule = () => {
        if (!newDate) return;
        // The hook might wait for { inspectionId, newDate, reason? }
        // Let's assume the hook accepts { id, date, reason } or similar.
        // We defined useRescheduleInspection in Step 1106 as:
        // mutationFn: ({ id, date, reason }) => ...
        rescheduleInspection({ id: inspectionId, date: newDate } as any, {
            onSuccess: () => {
                setRescheduleModal(false);
                setNewDate('');
            }
        });
    };

    // Helper functions
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusStyles: Record<string, { bg: string; label: string }> = {
            'PENDING_ALLOCATION': { bg: 'bg-secondary', label: 'Pending Allocation' },
            'ALLOCATED': { bg: 'bg-info', label: 'Allocated' },
            'SCHEDULED': { bg: 'bg-warning text-dark', label: 'Scheduled' },
            'IN_PROGRESS': { bg: 'bg-primary', label: 'In Progress' },
            'PENDING_APPROVAL': { bg: 'bg-info', label: 'Pending Review' },
            'REPORT_PUBLISHED': { bg: 'bg-success', label: 'Published' },
            'CLOSED': { bg: 'bg-success', label: 'Closed' },
        };
        const style = statusStyles[status] || { bg: 'bg-secondary', label: status };
        return <span className={`badge ${style.bg}`}>{style.label}</span>;
    };

    const getRiskBadge = (risk: string) => {
        const colors: Record<string, string> = {
            'HIGH': 'bg-danger',
            'MEDIUM': 'bg-warning text-dark',
            'LOW': 'bg-success',
        };
        return <span className={`badge ${colors[risk] || 'bg-secondary'}`}>{risk}</span>;
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="container-fluid">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !inspection) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Failed to load inspection details. The inspection may not exist or you may not have permission to view it.
                </div>
                <Link href="/department/inspection/report" className="btn btn-primary">
                    <i className="bi bi-arrow-left me-1"></i> Back to Report
                </Link>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <Link href="/department/inspection/report" className="btn btn-light me-3 shadow-sm">
                    <i className="bi bi-arrow-left"></i>
                </Link>
                <div className="flex-grow-1">
                    <h4 className="fw-bold mb-0">
                        Inspection Report
                        <code className="ms-2 text-primary">{inspection.inspectionId}</code>
                    </h4>
                    <p className="text-muted mb-0 small">
                        {inspection.unit.name} • {inspection.location.district}
                    </p>
                    {inspection.rescheduleRequested && (
                        <div className="alert alert-warning mt-2 mb-0 py-2 small d-inline-block">
                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                            <strong>Reschedule Requested:</strong> {inspection.rescheduleReason}
                        </div>
                    )}
                </div>
                <div className="d-flex align-items-center gap-3">
                    {getStatusBadge(inspection.status)}

                    {!inspection.rescheduleRequested && ['SCHEDULED', 'ALLOCATED', 'PENDING_ALLOCATION'].includes(inspection.status) && (
                        <button className="btn btn-outline-warning btn-sm" onClick={() => setRescheduleModal(true)}>
                            <i className="bi bi-calendar-event me-1"></i> Reschedule
                        </button>
                    )}
                    {inspection.rescheduleRequested && (
                        <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={() => setRescheduleModal(true)}>
                            <i className="bi bi-calendar-check me-1"></i> Review Reschedule
                        </button>
                    )}
                    <button className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-download me-1"></i> Export PDF
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-printer me-1"></i> Print
                    </button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-calendar-event text-primary fs-5"></i>
                                </div>
                                <div>
                                    <div className="text-muted small">Scheduled Date</div>
                                    <div className="fw-bold">{formatDate(inspection.scheduledDate)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-check-circle text-success fs-5"></i>
                                </div>
                                <div>
                                    <div className="text-muted small">Completed Date</div>
                                    <div className="fw-bold">{formatDate(inspection.completedAt) || 'Pending'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div className={`rounded-circle ${inspection.slaBreached ? 'bg-danger' : 'bg-success'} bg-opacity-10 p-3 me-3`}>
                                    <i className={`bi bi-clock ${inspection.slaBreached ? 'text-danger' : 'text-success'} fs-5`}></i>
                                </div>
                                <div>
                                    <div className="text-muted small">SLA Status</div>
                                    <div className="fw-bold">
                                        {inspection.slaBreached ? (
                                            <span className="text-danger">Overdue</span>
                                        ) : (
                                            <span className="text-success">Within SLA</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-speedometer2 text-info fs-5"></i>
                                </div>
                                <div>
                                    <div className="text-muted small">Compliance Score</div>
                                    <div className="fw-bold">
                                        {inspection.complianceScore != null ? (
                                            <span className={inspection.complianceScore >= 80 ? 'text-success' : inspection.complianceScore >= 60 ? 'text-warning' : 'text-danger'}>
                                                {inspection.complianceScore}%
                                            </span>
                                        ) : (
                                            'Pending'
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {[
                    { key: 'overview', label: 'Overview', icon: 'bi-info-circle' },
                    { key: 'checklist', label: 'Checklist', icon: 'bi-list-check' },
                    { key: 'observations', label: 'Observations', icon: 'bi-exclamation-circle' },
                    { key: 'evidence', label: 'Evidence', icon: 'bi-camera-video' },
                    { key: 'timeline', label: 'Timeline', icon: 'bi-clock-history' },
                ].map(tab => (
                    <li className="nav-item" key={tab.key}>
                        <button
                            className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={`bi ${tab.icon} me-1`}></i>
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="row g-4">
                        {/* Unit Information */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white py-3">
                                    <h6 className="fw-bold mb-0"><i className="bi bi-building me-2 text-primary"></i>Unit Information</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-sm table-borderless mb-0">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted" style={{ width: 140 }}>Unit Name</td>
                                                <td className="fw-semibold">{inspection.unit.name}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Application ID</td>
                                                <td><code>{inspection.unit.submissionId || '-'}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Sector</td>
                                                <td>{inspection.unit.sector}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Category</td>
                                                <td>{inspection.unit.category}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Address</td>
                                                <td>{inspection.unit.address}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">District</td>
                                                <td>{inspection.location.district}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Block/Tehsil</td>
                                                <td>{inspection.location.block}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Contact Person</td>
                                                <td>{inspection.unit.contactPerson}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Contact Number</td>
                                                <td>{inspection.unit.contactNumber}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Email</td>
                                                <td>{inspection.unit.email}</td>
                                            </tr>
                                            {inspection.unit.investmentAmount && (
                                                <tr>
                                                    <td className="text-muted">Investment</td>
                                                    <td>₹{inspection.unit.investmentAmount.toLocaleString()}</td>
                                                </tr>
                                            )}
                                            {inspection.unit.employmentGenerated && (
                                                <tr>
                                                    <td className="text-muted">Employment</td>
                                                    <td>{inspection.unit.employmentGenerated} jobs</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Inspection Details */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white py-3">
                                    <h6 className="fw-bold mb-0"><i className="bi bi-clipboard-check me-2 text-primary"></i>Inspection Details</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-sm table-borderless mb-0">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted" style={{ width: 140 }}>Inspection ID</td>
                                                <td><code className="text-primary">{inspection.inspectionId}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Financial Year</td>
                                                <td>{inspection.financialYear}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Type</td>
                                                <td>
                                                    <span className={`badge ${inspection.inspectionType === 'JOINT' ? 'bg-primary' : 'bg-info'}`}>
                                                        {inspection.inspectionType}
                                                    </span>
                                                    {inspection.isThirdParty && (
                                                        <span className="badge bg-secondary ms-1">Third Party</span>
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Department</td>
                                                <td>{inspection.department.abbreviation || inspection.department.name}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Service</td>
                                                <td>{inspection.service.name || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Risk Category</td>
                                                <td>{getRiskBadge(inspection.riskCategory)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Priority</td>
                                                <td>
                                                    <span className={`badge ${inspection.priority === 'HIGH' ? 'bg-danger' : 'bg-secondary'}`}>
                                                        {inspection.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Scheduled</td>
                                                <td>{formatDate(inspection.scheduledDate)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Started</td>
                                                <td>{formatDateTime(inspection.startedAt)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Completed</td>
                                                <td>{formatDateTime(inspection.completedAt)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">SLA Due</td>
                                                <td>{formatDate(inspection.slaDueDate)} ({inspection.slaDays} days)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Inspector Information */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white py-3">
                                    <h6 className="fw-bold mb-0"><i className="bi bi-person-badge me-2 text-primary"></i>Inspector Information</h6>
                                </div>
                                <div className="card-body">
                                    {inspection.inspector ? (
                                        <div className="d-flex align-items-center">
                                            <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                                <i className="bi bi-person-fill text-primary fs-4"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold">{inspection.inspector.name}</div>
                                                <div className="text-muted small">{inspection.inspector.email}</div>
                                                {inspection.inspector.mobile && (
                                                    <div className="text-muted small">{inspection.inspector.mobile}</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : inspection.thirdPartyInspector ? (
                                        <div>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-secondary me-2">Third Party</span>
                                                <span className="fw-bold">{inspection.thirdPartyInspector.firmName}</span>
                                            </div>
                                            <div className="small text-muted">
                                                <div>Contact: {inspection.thirdPartyInspector.contactPerson}</div>
                                                <div>Email: {inspection.thirdPartyInspector.email}</div>
                                                <div>Phone: {inspection.thirdPartyInspector.phone}</div>
                                                {inspection.thirdPartyInspector.accreditationNumber && (
                                                    <div>Accreditation: {inspection.thirdPartyInspector.accreditationNumber}</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-muted text-center py-3">
                                            <i className="bi bi-person-x fs-3 d-block mb-2"></i>
                                            Inspector not yet assigned
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fee Details */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white py-3">
                                    <h6 className="fw-bold mb-0"><i className="bi bi-currency-rupee me-2 text-primary"></i>Fee Details</h6>
                                </div>
                                <div className="card-body">
                                    {inspection.totalFeeCharge ? (
                                        <div className="text-center">
                                            <div className="fs-2 fw-bold text-success">₹{inspection.totalFeeCharge.toLocaleString()}</div>
                                            <div className="text-muted small">Total Fee Charged</div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-3">
                                            <i className="bi bi-dash-circle fs-3 d-block mb-2"></i>
                                            No fee applicable
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Feedback */}
                        {inspection.feedback && (
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white py-3">
                                        <h6 className="fw-bold mb-0"><i className="bi bi-star me-2 text-primary"></i>Investor Feedback</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="text-warning fs-4">
                                                {'★'.repeat(inspection.feedback.rating)}{'☆'.repeat(5 - inspection.feedback.rating)}
                                            </div>
                                            <div>
                                                <span className="fw-bold">{inspection.feedback.rating}/5</span>
                                                <span className="text-muted ms-2">• Submitted on {formatDate(inspection.feedback.submittedAt)}</span>
                                            </div>
                                        </div>
                                        {inspection.feedback.comment && (
                                            <div className="mt-3 p-3 bg-light rounded">
                                                <i className="bi bi-quote me-2"></i>
                                                {inspection.feedback.comment}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Checklist Tab */}
                {activeTab === 'checklist' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-list-check me-2 text-primary"></i>
                                {inspection.checklist?.name || 'Inspection Checklist'}
                            </h6>
                        </div>
                        <div className="card-body">
                            {inspection.checklist && inspection.checklist.items.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: 50 }}>#</th>
                                                <th>Question</th>
                                                <th style={{ width: 150 }}>Response</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inspection.checklist.items.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="text-muted">{index + 1}</td>
                                                    <td>
                                                        <div className="fw-medium">{item.question}</div>
                                                        {item.description && (
                                                            <small className="text-muted">{item.description}</small>
                                                        )}
                                                        {item.isMandatory && (
                                                            <span className="badge bg-danger bg-opacity-10 text-danger ms-2">Required</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.response ? (
                                                            <span className={`badge ${item.response.response === 'YES' || item.response.response === 'COMPLIANT' ? 'bg-success' : item.response.response === 'NO' || item.response.response === 'NON_COMPLIANT' ? 'bg-danger' : 'bg-secondary'}`}>
                                                                {item.response.response}
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-light text-muted">Not answered</span>
                                                        )}
                                                    </td>
                                                    <td className="text-muted small">
                                                        {item.response?.remarks || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-clipboard-x fs-1 d-block mb-2"></i>
                                    No checklist available for this inspection
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Observations Tab */}
                {activeTab === 'observations' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-exclamation-circle me-2 text-primary"></i>
                                Observations & Findings
                            </h6>
                        </div>
                        <div className="card-body">
                            {inspection.observations.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {inspection.observations.map(obs => (
                                        <div key={obs.id} className="border rounded p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-bold mb-0">{obs.title}</h6>
                                                <div className="d-flex gap-2">
                                                    <span className={`badge ${obs.severity === 'HIGH' ? 'bg-danger' : obs.severity === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                                        {obs.severity}
                                                    </span>
                                                    <span className={`badge ${obs.status === 'RESOLVED' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {obs.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-muted mb-2">{obs.description}</p>
                                            <small className="text-muted">Raised on {formatDateTime(obs.createdAt)}</small>

                                            {obs.responses.length > 0 && (
                                                <div className="mt-3 border-top pt-3">
                                                    <strong className="small">Responses:</strong>
                                                    {obs.responses.map(resp => (
                                                        <div key={resp.id} className="bg-light rounded p-2 mt-2 small">
                                                            <div className="d-flex justify-content-between">
                                                                <span className="badge bg-secondary">{resp.responderType}</span>
                                                                <small className="text-muted">{formatDateTime(resp.createdAt)}</small>
                                                            </div>
                                                            <p className="mb-0 mt-1">{resp.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                                    No observations or findings recorded
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Evidence Tab */}
                {activeTab === 'evidence' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-camera-video me-2 text-primary"></i>
                                Evidence & Attachments ({inspection.evidence.length})
                            </h6>
                        </div>
                        <div className="card-body">
                            {inspection.evidence.length > 0 ? (
                                <div className="row g-3">
                                    {inspection.evidence.map(ev => (
                                        <div key={ev.id} className="col-md-4 col-lg-3">
                                            <div className="card h-100">
                                                <div className="card-body text-center py-4">
                                                    <i className={`bi ${ev.fileType === 'image' ? 'bi-image' : ev.fileType === 'video' ? 'bi-camera-video' : 'bi-file-earmark'} fs-1 text-primary`}></i>
                                                    <div className="mt-2 small fw-medium text-truncate">
                                                        {ev.fileName || 'Attachment'}
                                                    </div>
                                                    <div className="text-muted small">
                                                        {ev.fileSize ? `${(ev.fileSize / 1024).toFixed(1)} KB` : ev.fileType}
                                                    </div>
                                                    {ev.geoLat && ev.geoLng && (
                                                        <div className="text-muted small">
                                                            <i className="bi bi-geo-alt"></i> Geo-tagged
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="card-footer bg-transparent border-0 text-center">
                                                    <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                        <i className="bi bi-eye me-1"></i> View
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-folder2-open fs-1 d-block mb-2"></i>
                                    No evidence or attachments uploaded
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-clock-history me-2 text-primary"></i>
                                Activity Timeline
                            </h6>
                        </div>
                        <div className="card-body">
                            {inspection.timeline.length > 0 ? (
                                <div className="position-relative ps-4">
                                    <div className="position-absolute start-0 top-0 bottom-0" style={{ width: 2, backgroundColor: '#e9ecef', marginLeft: 7 }}></div>
                                    {inspection.timeline.map((log, index) => (
                                        <div key={log.id} className="position-relative pb-4">
                                            <div className="position-absolute start-0 bg-primary rounded-circle" style={{ width: 16, height: 16, marginLeft: 0, marginTop: 4 }}></div>
                                            <div className="ms-4">
                                                <div className="fw-semibold">{log.action}</div>
                                                {log.fromValue && log.toValue && (
                                                    <div className="small text-muted">
                                                        <span className="text-decoration-line-through">{log.fromValue}</span>
                                                        <i className="bi bi-arrow-right mx-2"></i>
                                                        <span className="text-success">{log.toValue}</span>
                                                    </div>
                                                )}
                                                <div className="small text-muted">
                                                    {formatDateTime(log.createdAt)}
                                                    {log.performedBy && ` • By ${log.performedBy}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                                    No activity recorded yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    {inspection.rescheduleRequested ? 'Review Reschedule Request' : 'Reschedule Inspection'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setRescheduleModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {inspection.rescheduleRequested && (
                                    <div className="alert alert-light border mb-3">
                                        <div className="small text-muted text-uppercase fw-bold mb-1">Inspector's Reason</div>
                                        <p className="mb-0">{inspection.rescheduleReason}</p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Select New Date <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setRescheduleModal(false)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!newDate || isRescheduling}
                                    onClick={handleReschedule}
                                >
                                    {isRescheduling ? 'Updating...' : 'Confirm Reschedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
