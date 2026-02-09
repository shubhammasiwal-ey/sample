'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GlobalLoader() {
    const { isLoading } = useLoading();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [routeLoading, setRouteLoading] = useState(false);
    const lastManualLoadingAt = useRef<number | null>(null);
    const searchKey = searchParams?.toString() ?? '';

    useEffect(() => {
        if (isLoading) {
            lastManualLoadingAt.current = Date.now();
        }
    }, [isLoading]);

    // Detect route changes
    useEffect(() => {
        if (!pathname) return; // Safety check to prevent errors
        if (isLoading) return;
        if (lastManualLoadingAt.current && Date.now() - lastManualLoadingAt.current < 800) {
            return;
        }

        setRouteLoading(true);
        const timer = setTimeout(() => setRouteLoading(false), 500);
        return () => clearTimeout(timer);
    }, [pathname, searchKey, isLoading]);

    const showLoader = isLoading || routeLoading;

    if (!showLoader) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(2px)',
            }}
        >
            <div className="text-center">
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: '3rem', height: '3rem', borderWidth: '0.3rem' }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted fw-semibold">Loading...</p>
            </div>
        </div>
    );
}
