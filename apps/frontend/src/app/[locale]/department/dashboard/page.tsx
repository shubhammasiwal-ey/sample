'use client';

import Link from 'next/link';

export default function DepartmentDashboardAndOverview() {
    return (
        <div className="container-fluid">
            {/* Stats Row */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase small fw-bold">Total Applications</h6>
                            <h2 className="mb-0 fw-bold text-primary">1,245</h2>
                            <small className="text-success"><i className="bi bi-arrow-up-short"></i> +5.2% this month</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-warning">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase small fw-bold">Pending Review</h6>
                            <h2 className="mb-0 fw-bold text-warning">84</h2>
                            <small className="text-danger"><i className="bi bi-arrow-up-short"></i> +2 pending from yesterday</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-success">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase small fw-bold">Permits Issued</h6>
                            <h2 className="mb-0 fw-bold text-success">892</h2>
                            <small className="text-success"><i className="bi bi-check-circle"></i> 98% within SLA</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase small fw-bold">Total Revenue</h6>
                            <h2 className="mb-0 fw-bold text-info">₹ 4.2 Cr</h2>
                            <small className="text-muted">FY 2025-26</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="row g-4">
                {/* Recent Applications */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">Recent Applications</h6>
                            <Link href="/department/services" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-3">App ID</th>
                                        <th>Applicant</th>
                                        <th>Service</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td className="ps-3 fw-medium">#APP-2025-{100 + i}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avg bg-light rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 30, height: 30 }}>
                                                        {['A', 'B', 'C', 'D', 'E'][i - 1]}
                                                    </div>
                                                    <div>Enterprise {i}</div>
                                                </div>
                                            </td>
                                            <td>Factory License Renewal</td>
                                            <td className="text-muted">Jan {20 + i}, 2026</td>
                                            <td>
                                                <span className={`badge bg-${['warning', 'info', 'success', 'primary', 'secondary'][i - 1]} bg-opacity-10 text-${['warning', 'info', 'success', 'primary', 'secondary'][i - 1]}`}>
                                                    {['Pending', 'Under Process', 'Approved', 'Clarification', 'Rejected'][i - 1]}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-light border"><i className="bi bi-eye"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Notifications */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">Quick Actions</h6>
                            <div className="d-grid gap-2">
                                <button className="btn btn-primary d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-plus-circle me-2"></i>New Registration</span>
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                                <button className="btn btn-outline-dark d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-clipboard-data me-2"></i>Generate Report</span>
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                                <Link href="/department/inspection" className="btn btn-outline-dark d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-calendar-check me-2"></i>Schedule Inspection</span>
                                    <i className="bi bi-chevron-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="mb-0 fw-bold">Recent Notifications</h6>
                        </div>
                        <div className="list-group list-group-flush">
                            <div className="list-group-item px-3 py-3 border-bottom-0">
                                <div className="d-flex">
                                    <i className="bi bi-exclamation-circle text-warning fs-5 me-3"></i>
                                    <div>
                                        <p className="mb-1 small fw-medium">SLA Breach Warning</p>
                                        <p className="mb-0 small text-muted">Application #APP-892 is pending for {'>'} 15 days.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="list-group-item px-3 py-3 border-bottom-0">
                                <div className="d-flex">
                                    <i className="bi bi-info-circle text-info fs-5 me-3"></i>
                                    <div>
                                        <p className="mb-1 small fw-medium">New Scheme Launched</p>
                                        <p className="mb-0 small text-muted">Updated guidelines for subsidy enabled.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
