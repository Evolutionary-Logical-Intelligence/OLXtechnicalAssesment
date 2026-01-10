import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getNavigationCategories, Category, fetchCategories, ApiCategory } from '../lib/api';
import styles from './CategoryNavigation.module.css';

interface CategoryNavigationProps {
  categories?: Category[];
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories: propCategories,
}) => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<ApiCategory[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        
        const allApiCategories = await fetchCategories();
        setAllCategories(allApiCategories);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      console.log('Category clicked:', categoryId);
    }
  };

  const handleDropdownCategoryClick = (category: ApiCategory) => {
    console.log('Dropdown category clicked:', category.id, category.slug);
    setIsDropdownOpen(false);
  };

  const renderCategoryItem = (category: ApiCategory, level: number = 0) => {
    const name = language === 'ar' ? category.name_l1 : category.name;
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <div key={category.id} className={styles.dropdownCategoryItem} data-level={level}>
        <button
          className={styles.dropdownCategoryButton}
          onClick={() => handleDropdownCategoryClick(category)}
          type="button"
        >
          <span>{name}</span>
        </button>
        {hasChildren && (
          <div className={styles.dropdownSubcategories}>
            {category.children
              .sort((a, b) => a.displayPriority - b.displayPriority)
              .map((child) => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
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
    <nav className={styles.categoryNav} aria-label="Category Navigation" ref={dropdownRef}>
      <div className={styles.navWrapper}>
        {allCategoriesItem && (
          <div className={styles.fixedCategory}>
            <button
              className={`${styles.categoryItem} ${styles.hasDropdown} ${isDropdownOpen ? styles.isOpen : ''}`}
              type="button"
              onClick={() => handleCategoryClick(allCategoriesItem.id)}
              aria-label={allCategoriesItem.label}
            >
              {formatCategoryText(allCategoriesItem.label)}
              <svg
                className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.iconRotated : ''}`}
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
      {isDropdownOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownContent}>
            {allCategories
              .filter(cat => cat.level === 0 && cat.parentID === null)
              .sort((a, b) => a.displayPriority - b.displayPriority)
              .map((category) => renderCategoryItem(category))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default CategoryNavigation;

