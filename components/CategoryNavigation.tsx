import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getNavigationCategories, Category } from '../lib/api';
import styles from './CategoryNavigation.module.css';

interface CategoryNavigationProps {
  categories?: Category[];
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories: propCategories,
}) => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      if (propCategories && propCategories.length > 0) {
        setCategories(propCategories);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedCategories = await getNavigationCategories(language);
        setCategories(fetchedCategories);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [language, propCategories]);

  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId);
  };

  const formatCategoryText = (text: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= 1) {
      return <span className={styles.categoryText}>{text}</span>;
    }
    const firstPart = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];
    return (
      <span className={styles.categoryText}>
        <span className={styles.categoryTextLine}>{firstPart}</span>
        <span className={`${styles.categoryTextLine} ${styles.lastLine}`}>{lastWord}</span>
      </span>
    );
  };

  if (loading || error || categories.length === 0) {
    return null;
  }

  const allCategoriesItem = categories.find(cat => cat.hasDropdown);
  const otherCategories = categories.filter(cat => !cat.hasDropdown);

  return (
    <nav className={styles.categoryNav} aria-label="Category Navigation">
      <div className={styles.navWrapper}>
        {allCategoriesItem && (
          <div className={styles.fixedCategory}>
            <button
              className={`${styles.categoryItem} ${styles.hasDropdown}`}
              type="button"
              onClick={() => handleCategoryClick(allCategoriesItem.id)}
              aria-label={allCategoriesItem.label}
            >
              {formatCategoryText(allCategoriesItem.label)}
              <svg
                className={styles.dropdownIcon}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className={styles.scrollableContainer}>
          <div className={styles.categoryContainer}>
            {otherCategories.map((category) => (
              <button
                key={category.id}
                className={styles.categoryItem}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                aria-label={category.label}
              >
                {formatCategoryText(category.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CategoryNavigation;

