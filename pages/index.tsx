import Head from 'next/head';
import styles from '../styles/Home.module.css';
import CategoryNavigation from '../components/CategoryNavigation';
import BannerCarousel from '../components/BannerCarousel';
import bannerSmallStyles from '../components/BannerCarouselSmall.module.css';
import CategoriesGrid from '../components/CategoriesGrid';

export default function Home() {
  const mainBannerSlides = [
    {
      id: '1',
      imageUrl: '/banners/carouselImage1.jpeg',
      alt: 'Promotional banner 1',
    },
    {
      id: '2',
      imageUrl: '/banners/carouselImage2.jpg',
      alt: 'Promotional banner 2',
    },
    {
      id: '3',
      imageUrl: '/banners/carouselImage3.png',
      alt: 'Promotional banner 3',
    },
  ];

  const smallBannerSlides = [
    {
      id: '1',
      imageUrl: '/promoBanners/promoImage1.jpeg',
      alt: 'Small banner 1',
    },
    {
      id: '2',
      imageUrl: '/promoBanners/promoImage2.jpeg',
      alt: 'Small banner 2',
    }
  ];

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
        <div className={styles.bannerWrapper}>
          <BannerCarousel slides={mainBannerSlides} />
        </div>
        <div className={styles.bannerWrapper}>
          <BannerCarousel customStyles={bannerSmallStyles} slides={smallBannerSlides} />
        </div>
        <CategoriesGrid />
      </main>
    </>
  );
}

