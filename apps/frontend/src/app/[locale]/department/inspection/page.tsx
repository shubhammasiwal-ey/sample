'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useCISDashboard, useCISReport, CISDepartmentStats } from '@/hooks/useInspections';

// ==========================================
// Constants
// ==========================================

const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026'];
const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

export default function InspectorDashboardPage() {
    const [finYear, setFinYear] = useState('2025-2026');
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // Fetch dashboard data from API
    const { data: dashboardData, isLoading, error } = useCISDashboard(finYear);

    // Derived data from API response
    const currentTableData = useMemo(() => {
        return dashboardData?.departments || [];
    }, [dashboardData]);

    const totals = useMemo(() => {
        return dashboardData?.totals || { planned: 0, completed: 0, pending: 0, reschedulePending: 0, overdue: 0, sla: 0 };
    }, [dashboardData]);

    const riskData = useMemo(() => {
        return dashboardData?.riskDistribution || [
            { name: 'High Risk', value: 0 },
            { name: 'Medium Risk', value: 0 },
            { name: 'Low Risk', value: 0 },
        ];
    }, [dashboardData]);

    // Chart Data (Derived from Table Data)
    const chartData = useMemo(() => {
        return currentTableData.map(d => ({
            name: d.name,
            Assigned: d.planned,
            Conducted: d.completed
        }));
    }, [currentTableData]);

    // Filter Stats based on Selected Dept (or show totals)
    const activeStats = selectedDept
        ? currentTableData.find(d => d.name === selectedDept) || totals
        : totals;

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
    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger" role="alert">
                    Failed to load dashboard data. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Compact Stats Cards Row */}
            <div className="d-flex gap-2 mb-3 align-items-center">
                <div className="flex-fill">
                    <Link
                        href={`/department/inspection/report?financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${activeStats.id}` : ''}`}
                        className="text-decoration-none"
                    >
                        <div className="card border-0 shadow-sm text-center px-3 py-2 h-100 hover-shadow transition-all">
                            <div className="text-primary fw-bold h5 mb-0">{activeStats.planned}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Total Planned</div>
                        </div>
                    </Link>
                </div>
                <div className="flex-fill">
                    <Link
                        href={`/department/inspection/report?status=REPORT_PUBLISHED&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${activeStats.id}` : ''}`}
                        className="text-decoration-none"
                    >
                        <div className="card border-0 shadow-sm text-center px-3 py-2 h-100 hover-shadow transition-all">
                            <div className="text-success fw-bold h5 mb-0">{activeStats.completed}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Completed</div>
                        </div>
                    </Link>
                </div>
                <div className="flex-fill">
                    <Link
                        href={`/department/inspection/report?status=SCHEDULED&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${activeStats.id}` : ''}`}
                        className="text-decoration-none"
                    >
                        <div className="card border-0 shadow-sm text-center px-3 py-2 h-100 hover-shadow transition-all">
                            <div className="text-warning fw-bold h5 mb-0">{activeStats.pending}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Pending</div>
                        </div>
                    </Link>
                </div>
                <div className="flex-fill">
                    <Link
                        href={`/department/inspection/report?rescheduleRequested=true&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${activeStats.id}` : ''}`}
                        className="text-decoration-none"
                    >
                        <div className="card border-0 shadow-sm text-center px-3 py-2 h-100 hover-shadow transition-all">
                            <div className="text-info fw-bold h5 mb-0">{activeStats.reschedulePending || 0}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Reschedule Requested</div>
                        </div>
                    </Link>
                </div>
                <div className="flex-fill">
                    <Link
                        href={`/department/inspection/report?slaStatus=overdue&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${activeStats.id}` : ''}`}
                        className="text-decoration-none"
                    >
                        <div className="card border-0 shadow-sm text-center px-3 py-2 h-100 hover-shadow transition-all">
                            <div className="text-danger fw-bold h5 mb-0">{activeStats.overdue}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Overdue</div>
                        </div>
                    </Link>
                </div>
                <div>
                    <Link
                        href="/department/inspection/schedule"
                        className="btn btn-primary btn-sm d-flex align-items-center gap-2 text-nowrap"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Schedule Inspection
                    </Link>
                </div>
            </div>

            {/* Top Row: Summary Table + Pie Chart Side by Side */}
            <div className="row g-4 mb-4">
                {/* Summary Table (Compact) */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden">
                        <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0 small">Departmental Performance Summary</h6>
                            <select
                                className="form-select form-select-sm w-auto fw-semibold border-primary"
                                value={finYear}
                                onChange={(e) => setFinYear(e.target.value)}
                                style={{ fontSize: '0.75rem' }}
                            >
                                {FINANCIAL_YEARS.map(year => (
                                    <option key={year} value={year}>FY {year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="table table-hover table-bordered mb-0 text-center align-middle table-sm small" style={{ minWidth: '700px' }}>
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-start ps-3">Department</th>
                                        <th>Planned</th>
                                        <th>Completed</th>
                                        <th>Pending</th>
                                        <th>Resched. Req.</th>
                                        <th>Overdue</th>
                                        <th>SLA %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTableData.map((row) => (
                                        <tr
                                            key={row.id}
                                            style={{ backgroundColor: selectedDept === row.name ? '#eff6ff' : undefined }}
                                        >
                                            <td
                                                className="text-start ps-3 fw-semibold text-primary"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedDept(selectedDept === row.name ? null : row.name)}
                                            >
                                                {row.name}
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&financialYear=${finYear}`}
                                                    className="text-decoration-none fw-semibold text-primary"
                                                    target="_blank"
                                                >
                                                    {row.planned}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&status=REPORT_PUBLISHED&financialYear=${finYear}`}
                                                    className="text-decoration-none fw-semibold text-success"
                                                    target="_blank"
                                                >
                                                    {row.completed}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&status=SCHEDULED&financialYear=${finYear}`}
                                                    className="text-decoration-none fw-semibold text-warning"
                                                    target="_blank"
                                                >
                                                    {row.pending}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&rescheduleRequested=true&financialYear=${finYear}`}
                                                    className="text-decoration-none fw-semibold text-info"
                                                    target="_blank"
                                                >
                                                    {row.reschedulePending || 0}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&slaStatus=overdue&financialYear=${finYear}`}
                                                    className="text-decoration-none fw-semibold text-danger"
                                                    target="_blank"
                                                >
                                                    {row.overdue}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    <div className="progress" style={{ width: '40px', height: '5px' }}>
                                                        <div
                                                            className={`progress-bar ${row.sla >= 90 ? 'bg-success' : row.sla >= 80 ? 'bg-warning' : 'bg-danger'}`}
                                                            role="progressbar"
                                                            style={{ width: `${row.sla}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{row.sla}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="table-primary fw-bold">
                                        <td className="text-start ps-3">Total</td>
                                        <td>
                                            <Link
                                                href={`/department/inspection/report?financialYear=${finYear}`}
                                                className="text-decoration-none text-primary"
                                                target="_blank"
                                            >
                                                {totals.planned}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/department/inspection/report?status=REPORT_PUBLISHED&financialYear=${finYear}`}
                                                className="text-decoration-none text-success"
                                                target="_blank"
                                            >
                                                {totals.completed}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/department/inspection/report?status=SCHEDULED&financialYear=${finYear}`}
                                                className="text-decoration-none text-warning"
                                                target="_blank"
                                            >
                                                {totals.pending}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/department/inspection/report?rescheduleRequested=true&financialYear=${finYear}`}
                                                className="text-decoration-none text-info"
                                                target="_blank"
                                            >
                                                {totals.reschedulePending || 0}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/department/inspection/report?slaStatus=overdue&financialYear=${finYear}`}
                                                className="text-decoration-none text-danger"
                                                target="_blank"
                                            >
                                                {totals.overdue}
                                            </Link>
                                        </td>
                                        <td>{totals.sla}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-2">
                            <h6 className="fw-bold mb-0 small">Unit Risk Distribution</h6>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center py-2">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={riskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {riskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="d-flex justify-content-center gap-3 mt-2">
                                {riskData.map((entry, index) => {
                                    const riskValue = entry.name.split(' ')[0].toUpperCase(); // 'High Risk' -> 'HIGH'
                                    return (
                                        <Link
                                            key={entry.name}
                                            href={`/department/inspection/report?riskCategory=${riskValue}`}
                                            className="d-flex align-items-center gap-1 small text-decoration-none text-body"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[index] }}></div>
                                            <span className="fw-semibold">{entry.name} ({entry.value})</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Bar Chart Only (Stats moved to top) */}
            <div className="row g-4 mb-4">

                {/* Bar Chart - Full Width */}
                <div className="col-lg-12">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-2">
                            <h6 className="fw-bold mb-0 small">Inspections: Assigned vs Conducted</h6>
                        </div>
                        <div className="card-body py-2">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Conducted" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
