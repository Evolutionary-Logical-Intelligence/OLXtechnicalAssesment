import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

function AppContent({ Component, pageProps, router }: AppProps) {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'ar' ? 'ar' : 'en';
  }, [language]);

  return (
    <>
      <Navbar />
      <Component {...pageProps} router={router} />
    </>
  );
}

export default function App(appProps: AppProps) {
  return (
    <LanguageProvider>
      <AppContent {...appProps} />
    </LanguageProvider>
  );
}

