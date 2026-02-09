import Script from "next/script";

export const metadata = {
  title: "Single Window Clerance System",
  description: "Directorate of Industries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Global scripts that must load before hydration */}
        <Script src="/js/tweenMax.min.js" strategy="beforeInteractive" />
        <Script src="/js/wow.min.js" strategy="beforeInteractive" />
      </head>
      <body className='sticky-header-inner'>{children}</body>
    </html>
  );
}
