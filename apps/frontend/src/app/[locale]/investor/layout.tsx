"use client";
import './investor.css';
import React from 'react';
import Header from '@/components/(investor)/Header';
import Sidebar from '@/components/(investor)/Sidebar';
import Footer from '@/components/(investor)/Footer';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

function InvestorLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="tailwind-scope" style={{ minHeight: '100vh' }}>
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <Sidebar />

      {/* Main Content - margin adjusts based on sidebar state */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease-in-out',
        }}
        className={`investor-main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        <Header />

        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <InvestorLayoutContent>{children}</InvestorLayoutContent>
    </SidebarProvider>
  );
}
