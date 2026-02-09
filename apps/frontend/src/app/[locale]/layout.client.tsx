"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "@/app/globals.css";
import "../../../styles/variables.css";
import "../../../styles/include.css";
import "../../../styles/style.css";
import "../../../styles/component.css";
import "../../../styles/responsive.css";
import "../../../styles/animate.min.css";

import React, { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import Header from "@/components/homepage/Header";
import Footer from "@/components/homepage/Footer";
import { Providers } from "../providers";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();

  const isDashboard = segments.includes("admin")
    || segments.includes("user")
    || segments.includes("investor")
    || segments.includes("department");


  useEffect(() => {
    const handleScroll = () => {
      document.body.classList.toggle("sticky-header", window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isDashboard) {
      document.body.classList.add("dashboard-page");
    } else {
      document.body.classList.remove("dashboard-page");
    }
  }, [isDashboard]);

  return (
    <Providers>
      {!isDashboard && <Header />}
      <main>{children}</main>
      {!isDashboard && <Footer />}

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js"
        strategy="afterInteractive"
      />
    </Providers>
  );
}
