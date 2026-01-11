import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCategories, ApiCategory } from '../lib/api';
import styles from './CategoriesGrid.module.css';
import Image from 'next/image'; 
interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
}

const CategoriesGrid: React.FC = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    console.log('Category clicked:', category.id, category.slug);
  };

  if (loading) {
    return null;
  }

  if (error || categories.length === 0) {
    return null;
  }

  return (
    <div className={styles.categoriesGridContainer}>
      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <div
            key={category.id}
            className={styles.categoryItem}
            onClick={() => handleCategoryClick(category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCategoryClick(category);
              }
            }}
          >
            <div className={styles.categoryIconWrapper}>
              <Image
                src={category.iconUrl || '/categoryIcons/vehicle.png'}
                alt={category.name}
                className={styles.categoryIcon}
                fill
                sizes="(max-width: 480px) 80px, (max-width: 768px) 90px, (max-width: 1200px) 100px, 120px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/categoryIcons/vehicle.png';
                }}
              />
            </div>
            <span className={styles.categoryLabel}>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesGrid;

