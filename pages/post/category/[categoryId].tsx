import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import PostAdNavigation from '../../../components/PostAdNavigation';
import CategoryBrowser from '../../../components/CategoryBrowser';
import { fetchCategories, ApiCategory } from '../../../lib/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import styles from '../../../styles/PostAd.module.css';
import categoryStyles from '../../../components/CategorySelection.module.css';

export default function CategoryDetailPage() {
  const router = useRouter();
  const { categoryId } = router.query;
  const { language } = useLanguage();
  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId || typeof categoryId !== 'string') {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const apiCategories = await fetchCategories();
        const categoryIdNum = parseInt(categoryId, 10);
        
        const foundCategory = apiCategories.find((cat) => cat.id === categoryIdNum);

        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          setError('Category not found');
        }
      } catch (err) {
        setError('Failed to load category');
        console.error('Error loading category:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Category - OLX</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <PostAdNavigation />
        <main className={styles.main}>
          <h1 className={styles.title}>Post an Ad</h1>
          <div className={categoryStyles.container}>
            <h2 className={categoryStyles.title}>Choose a category</h2>
            <div className={categoryStyles.loading}>Loading category...</div>
          </div>
        </main>
      </>
    );
  }

  if (error || !category) {
    return (
      <>
        <Head>
          <title>Category Not Found - OLX</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <PostAdNavigation />
        <main className={styles.main}>
          <h1 className={styles.title}>Post an Ad</h1>
          <div className={categoryStyles.container}>
            <h2 className={categoryStyles.title}>Choose a category</h2>
            <div className={categoryStyles.error}>{error || 'Category not found'}</div>
          </div>
        </main>
      </>
    );
  }

  const categoryName = language === 'ar' ? category.name_l1 : category.name;
  const categoryIdNum = categoryId && typeof categoryId === 'string' ? parseInt(categoryId, 10) : null;

  const handleCategorySelect = (newCategoryId: number) => {
    router.push(`/post/category/${newCategoryId}`);
  };

  return (
    <>
      <Head>
        <title>{categoryName} - Post an Ad - OLX</title>
        <meta name="description" content={`Post an ad in ${categoryName} category`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PostAdNavigation />
      <main className={styles.main}>
        <h1 className={styles.title}>Post an Ad</h1>
        <div className={categoryStyles.container}>
          <h2 className={categoryStyles.title}>Choose a category</h2>
          <CategoryBrowser
            selectedCategoryId={categoryIdNum}
            onCategorySelect={handleCategorySelect}
          />
        </div>
      </main>
    </>
  );
}

