import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCategories, ApiCategory } from '../lib/api';
import styles from './CategorySelection.module.css';
import Image from 'next/image'; 
interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
}

const CategorySelection: React.FC = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiCategories = await fetchCategories();
        
        const topLevelCategories = apiCategories.filter(
          (cat) => cat.level === 0 && cat.parentID === null
        );

        const sortedCategories = topLevelCategories.sort(
          (a, b) => a.displayPriority - b.displayPriority
        );

        const categoryItems: CategoryItem[] = sortedCategories.map((cat) => ({
          id: cat.id,
          name: language === 'ar' ? cat.name_l1 : cat.name,
          slug: cat.slug,
          iconUrl: `/categoryicons/${cat.slug}.png`, 
        }));

        setCategories(categoryItems);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [language]);

  const handleCategoryClick = (category: CategoryItem) => {
    console.log('Category selected:', category.id, category.slug);
    setSelectedCategoryId(category.id);
    router.push(`/post/category/${category.id}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Choose a category</h2>
        <div className={styles.loading}>Loading categories...</div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Choose a category</h2>
        <div className={styles.error}>Failed to load categories. Please try again.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Choose a category</h2>
      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`${styles.categoryCard} ${selectedCategoryId === category.id ? styles.selected : ''}`}
            onClick={() => handleCategoryClick(category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCategoryClick(category);
              }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconWrapper}>
                <Image
                  src={category.iconUrl || '/categoryIcons/vehicle.png'}
                  alt={category.name}
                  className={styles.categoryIcon}
                  width={60}
                  height={60}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/categoryIcons/vehicle.png';
                  }}
                />
              </div>
              <span className={styles.categoryName}>{category.name}</span>
              <svg
                className={styles.chevronIcon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection;

