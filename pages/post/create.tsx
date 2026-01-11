import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PostAdNavigation from '../../components/PostAdNavigation';
import AdForm from '../../components/AdForm';
import AdPreview from '../../components/AdPreview';
import { fetchCategories, ApiCategory } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from '../../styles/PostAd.module.css';
import createStyles from '../../styles/CreateAd.module.css';

export default function CreateAdPage() {
  const router = useRouter();
  const { categoryId, subCategoryId, subItemId } = router.query;
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ApiCategory | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<ApiCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryInfo = async () => {
      if (!categoryId || typeof categoryId !== 'string') {
        setLoading(false);
        return;
      }

      try {
        const apiCategories = await fetchCategories();
        const categoryIdNum = parseInt(categoryId, 10);
        
        const foundCategory = apiCategories.find((cat) => cat.id === categoryIdNum);
        if (foundCategory) {
          setSelectedCategory(foundCategory);
        }

        if (subCategoryId && typeof subCategoryId === 'string') {
          const subCategoryIdNum = parseInt(subCategoryId, 10);
          const foundSubCategory = apiCategories.find((cat) => cat.id === subCategoryIdNum);
          if (foundSubCategory) {
            setSelectedSubCategory(foundSubCategory);
          }
        }

        if (subItemId && typeof subItemId === 'string') {
          const subItemIdNum = parseInt(subItemId, 10);
          const foundSubItem = apiCategories.find((cat) => cat.id === subItemIdNum);
          if (foundSubItem) {
            setSelectedSubItem(foundSubItem);
          }
        }
      } catch (error) {
        console.error('Error loading category info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryInfo();
  }, [categoryId, subCategoryId, subItemId]);

  // Determine which category slug to use (prefer sub-item, then sub-category, then main category)
  const categorySlug = selectedSubItem?.slug || selectedSubCategory?.slug || selectedCategory?.slug || '';

  return (
    <>
      <Head>
        <title>Sell your ad - OLX</title>
        <meta name="description" content="Sell your ad on OLX" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PostAdNavigation />
      <main className={styles.main}>
        <h1 className={styles.title}>Sell your ad</h1>
        <div className={createStyles.contentWrapper}>
          <div className={createStyles.formSection}>
            {loading ? (
              <div className={styles.container}>Loading form...</div>
            ) : (
              <AdForm 
                categorySlug={categorySlug}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                selectedSubItem={selectedSubItem}
              />
            )}
          </div>
          <div className={createStyles.previewSection}>
            <AdPreview />
          </div>
        </div>
      </main>
    </>
  );
}

