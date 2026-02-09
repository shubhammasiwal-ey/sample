'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DepartmentLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname.includes(path);

    return (
        <div className="d-flex min-vh-100 bg-light">
            {/* Sidebar */}
            <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '260px' }}>
                <Link href="/department/dashboard" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                    <span className="fs-4 fw-bold">Dept. Portal</span>
                </Link>
                <hr />
                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item mb-1">
                        <Link
                            href="/department/dashboard"
                            className={`nav-link text-white ${pathname.endsWith('/department/dashboard') ? 'active' : ''}`}
                        >
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </Link>
                    </li>
                    <li className="nav-item mb-1">
                        <Link
                            href="/department/services"
                            className={`nav-link text-white ${isActive('/department/services') ? 'active' : ''}`}
                        >
                            <i className="bi bi-gear-wide-connected me-2"></i>
                            Services
                        </Link>
                    </li>
                    <li className="nav-item mb-1">
                        <Link
                            href="/department/inspection"
                            className={`nav-link text-white ${isActive('/department/inspection') ? 'active' : ''}`}
                        >
                            <i className="bi bi-clipboard-check me-2"></i>
                            Inspections (CIS)
                        </Link>
                    </li>
                    <li className="nav-item mb-1">
                        <Link
                            href="/department/reports"
                            className={`nav-link text-white ${isActive('/department/reports') ? 'active' : ''}`}
                        >
                            <i className="bi bi-file-earmark-bar-graph me-2"></i>
                            Reports
                        </Link>
                    </li>
                    <li className="nav-item mb-1">
                        <Link
                            href="/department/users"
                            className={`nav-link text-white ${isActive('/department/users') ? 'active' : ''}`}
                        >
                            <i className="bi bi-people me-2"></i>
                            User Management
                        </Link>
                    </li>
                </ul>
                <hr />
                <div className="dropdown">
                    <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                        <div className="bg-success rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                            D
                        </div>
                        <strong>Department User</strong>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                        <li><a className="dropdown-item" href="#">Profile</a></li>
                        <li><a className="dropdown-item" href="#">Settings</a></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><a className="dropdown-item" href="/login">Sign out</a></li>
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
                <header className="py-3 px-4 border-bottom bg-white d-flex align-items-center justify-content-between sticky-top">
                    <h5 className="mb-0 text-secondary">Department Administration System</h5>
                    <div className="d-flex gap-3 align-items-center">
                        <div className="input-group input-group-sm" style={{ width: '250px' }}>
                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control bg-light border-start-0" placeholder="Search..." />
                        </div>
                        <button className="btn btn-outline-secondary btn-sm position-relative">
                            <i className="bi bi-bell"></i>
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                <span className="visually-hidden">New alerts</span>
                            </span>
                        </button>
                    </div>
                </header>
                <main className="p-4 flex-grow-1 bg-light">
                    {children}
                </main>
            </div>
        </div>
    );
}
