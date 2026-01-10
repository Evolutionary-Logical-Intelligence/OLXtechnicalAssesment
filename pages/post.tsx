import Head from 'next/head';
import PostAdNavigation from '../components/PostAdNavigation';
import CategorySelection from '../components/CategorySelection';
import styles from '../styles/PostAd.module.css';

export default function PostAd() {
  return (
    <>
      <Head>
        <title>Post an Ad - OLX</title>
        <meta name="description" content="Post your ad on OLX" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PostAdNavigation />
      <main className={styles.main}>
        <h1 className={styles.title}>Post an Ad</h1>
        <CategorySelection />
      </main>
    </>
  );
}

