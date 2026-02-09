import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "../providers";
import LocaleLayoutClient from "./layout.client";

const locales = ["en", "hi"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // ✅ Promise
}) {
  // ✅ MUST await params in Next.js 16
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
     <Providers> 
    <NextIntlClientProvider locale={locale} messages={messages}>
     <LocaleLayoutClient>{children}</LocaleLayoutClient>    
    </NextIntlClientProvider>
    </Providers> 
  );
}
