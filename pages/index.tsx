import Head from 'next/head';
import styles from '../styles/Home.module.css';
import CategoryNavigation from '../components/CategoryNavigation';

export default function Home() {
  return (
    <>
      <Head>
        <title>OLX Technical Assessment</title>
        <meta name="description" content="OLX Technical Assessment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <CategoryNavigation />
        <h1>Welcome to OLX</h1>
      </main>
    </>
  );
}

