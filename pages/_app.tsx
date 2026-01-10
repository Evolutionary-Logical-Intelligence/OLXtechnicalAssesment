import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

function AppContent({ Component, pageProps, router }: AppProps) {
  const { language } = useLanguage();
  const nextRouter = useRouter();

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'ar' ? 'ar' : 'en';
  }, [language]);

  const isPostAdPage = nextRouter.pathname === '/post' || nextRouter.pathname.startsWith('/post/');

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      {!isPostAdPage && <Navbar />}
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

