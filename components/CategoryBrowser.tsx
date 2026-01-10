import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCategories, ApiCategory } from '../lib/api';
import styles from './CategoryBrowser.module.css';

interface CategoryBrowserProps {
  selectedCategoryId: number | null;
  onCategorySelect?: (categoryId: number) => void;
}

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  selectedCategoryId,
  onCategorySelect,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const [allCategories, setAllCategories] = useState<ApiCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [subCategories, setSubCategories] = useState<ApiCategory[]>([]);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ApiCategory | null>(null);
  const [subItems, setSubItems] = useState<ApiCategory[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [expandedSubCategoryId, setExpandedSubCategoryId] = useState<number | null>(null);
  const [categorySubCategoriesMap, setCategorySubCategoriesMap] = useState<Map<number, ApiCategory[]>>(new Map());
  const [subCategoryItemsMap, setSubCategoryItemsMap] = useState<Map<number, ApiCategory[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiCategories = await fetchCategories();
        setAllCategories(apiCategories);

        // Get main categories (level 0, no parent)
        const topLevelCategories = apiCategories.filter(
          (cat) => cat.level === 0 && cat.parentID === null
        );

        const sortedMainCategories = topLevelCategories.sort(
          (a, b) => a.displayPriority - b.displayPriority
        );

        setMainCategories(sortedMainCategories);

        // Build maps for all categories' children for accordion functionality
        const categoryMap = new Map<number, ApiCategory[]>();
        const subCategoryMap = new Map<number, ApiCategory[]>();

        sortedMainCategories.forEach((category) => {
          // Get children of this category
          let children: ApiCategory[] = [];
          if (category.children && category.children.length > 0) {
            children = category.children;
          } else {
            children = apiCategories.filter(
              (cat) => cat.parentID === category.id
            );
          }
          const sortedChildren = children.sort(
            (a, b) => a.displayPriority - b.displayPriority
          );
          categoryMap.set(category.id, sortedChildren);

          // Build sub-category items map for all sub-categories
          sortedChildren.forEach((subCat) => {
            let subItems: ApiCategory[] = [];
            if (subCat.children && subCat.children.length > 0) {
              subItems = subCat.children;
            } else {
              subItems = apiCategories.filter(
                (cat) => cat.parentID === subCat.id
              );
            }
            const sortedSubItems = subItems.sort(
              (a, b) => a.displayPriority - b.displayPriority
            );
            subCategoryMap.set(subCat.id, sortedSubItems);
          });
        });

        setCategorySubCategoriesMap(categoryMap);
        setSubCategoryItemsMap(subCategoryMap);

        // Find selected category and its children
        if (selectedCategoryId) {
          const foundCategory = apiCategories.find((cat) => cat.id === selectedCategoryId);
          if (foundCategory) {
            setSelectedCategory(foundCategory);
            const children = categoryMap.get(selectedCategoryId) || [];
            setSubCategories(children);
            
            // On mobile, also expand the selected category
            const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
            if (isMobile) {
              setExpandedCategoryId(selectedCategoryId);
            }
            
            // Reset sub-category selection when main category changes
            setSelectedSubCategoryId(null);
            setSelectedSubCategory(null);
            setSubItems([]);
            setExpandedSubCategoryId(null);
          }
        }
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [selectedCategoryId]);

  const handleMainCategoryClick = (category: ApiCategory) => {
    const newCategoryId = category.id;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    if (isMobile) {
      // Mobile accordion behavior: toggle if clicking the same category, otherwise expand new one (collapse previous)
      if (expandedCategoryId === newCategoryId) {
        // Toggle: collapse if already expanded
        setExpandedCategoryId(null);
        setExpandedSubCategoryId(null);
        setSelectedCategory(null);
        setSubCategories([]);
      } else {
        // Expand new category, collapse previous
        setExpandedCategoryId(newCategoryId);
        setExpandedSubCategoryId(null); // Collapse any open sub-category
        
        // Update selected category
        const children = categorySubCategoriesMap.get(newCategoryId) || [];
        setSubCategories(children);
        setSelectedCategory(category);
      }
    } else {
      // Desktop: navigate to category page
      if (onCategorySelect) {
        onCategorySelect(newCategoryId);
      } else {
        router.push(`/post/category/${newCategoryId}`);
      }
    }
  };

  const handleSubCategoryClick = (category: ApiCategory) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    // Check if this sub-category has children
    const hasChildren = (category.children && category.children.length > 0) ||
      allCategories.some((cat) => cat.parentID === category.id) ||
      (subCategoryItemsMap.get(category.id) && subCategoryItemsMap.get(category.id)!.length > 0);
    
    if (hasChildren) {
      if (isMobile) {
        // Mobile accordion behavior: toggle if clicking the same sub-category
        if (expandedSubCategoryId === category.id) {
          setExpandedSubCategoryId(null);
        } else {
          setExpandedSubCategoryId(category.id);
          
          // Get children of the selected sub-category
          const children = subCategoryItemsMap.get(category.id) || [];
          setSubItems(children);
          setSelectedSubCategoryId(category.id);
          setSelectedSubCategory(category);
        }
      } else {
        // Desktop: show in right column
        setExpandedSubCategoryId(category.id);
        const children = subCategoryItemsMap.get(category.id) || [];
        setSubItems(children);
        setSelectedSubCategoryId(category.id);
        setSelectedSubCategory(category);
      }
    } else {
      // No children - handle final selection
      console.log('Final sub-category selected:', category.id, category.slug);
      // TODO: Navigate to next step in post ad flow
    }
  };

  const handleSubItemClick = (subItem: ApiCategory) => {
    // Handle sub-item selection (final level)
    console.log('Sub-item selected:', subItem.id, subItem.slug);
    // TODO: Navigate to next step in post ad flow
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Column - Main Categories */}
      <div className={styles.leftColumn}>
        <div className={styles.sectionHeader}>Categories</div>
        {mainCategories.map((category, index) => {
          const categoryName = language === 'ar' ? category.name_l1 : category.name;
          const isSelected = selectedCategoryId === category.id;
          const isExpanded = expandedCategoryId === category.id;
          const iconUrl = `/categoryicons/${category.slug}.png`;
          const subCategories = categorySubCategoriesMap.get(category.id) || [];

          return (
            <div key={category.id} className={styles.categoryGroup}>
              <div
                className={`${styles.categoryRow} ${isSelected ? styles.selected : ''} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => handleMainCategoryClick(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleMainCategoryClick(category);
                  }
                }}
              >
                <div className={styles.categoryRowContent}>
                  <img
                    src={iconUrl}
                    alt={categoryName}
                    className={styles.categoryIcon}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/categoryIcons/vehicle.png';
                    }}
                  />
                  <span className={styles.categoryName}>{categoryName}</span>
                  <svg
                    className={`${styles.chevronIcon} ${isExpanded ? styles.chevronExpanded : ''}`}
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
              {/* Mobile Accordion: Sub-categories under expanded category */}
              <div className={`${styles.mobileSubCategories} ${isExpanded ? styles.expandedContent : ''}`}>
                {subCategories.map((subCategory, subIndex) => {
                  const subCategoryName = language === 'ar' ? subCategory.name_l1 : subCategory.name;
                  const isSubExpanded = expandedSubCategoryId === subCategory.id;
                  const hasChildren = subCategoryItemsMap.get(subCategory.id)?.length > 0 || false;
                  const subItems = subCategoryItemsMap.get(subCategory.id) || [];

                  return (
                    <div key={subCategory.id} className={styles.subCategoryGroup}>
                      <div
                        className={`${styles.mobileSubCategoryRow} ${isSubExpanded ? styles.expanded : ''}`}
                        onClick={() => handleSubCategoryClick(subCategory)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSubCategoryClick(subCategory);
                          }
                        }}
                      >
                        <div className={styles.subCategoryRowContent}>
                          <span className={styles.subCategoryName}>{subCategoryName}</span>
                          {hasChildren && (
                            <svg
                              className={`${styles.chevronIcon} ${isSubExpanded ? styles.chevronExpanded : ''}`}
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
                          )}
                        </div>
                      </div>
                      {/* Mobile Accordion: Sub-items under expanded sub-category */}
                      {hasChildren && (
                        <div className={`${styles.mobileSubItems} ${isSubExpanded ? styles.expandedContent : ''}`}>
                          {subItems.map((subItem, itemIndex) => {
                            const subItemName = language === 'ar' ? subItem.name_l1 : subItem.name;
                            return (
                              <div key={subItem.id}>
                                <div
                                  className={styles.mobileSubItemRow}
                                  onClick={() => handleSubItemClick(subItem)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      handleSubItemClick(subItem);
                                    }
                                  }}
                                >
                                  <div className={styles.subItemRowContent}>
                                    <span className={styles.subItemName}>{subItemName}</span>
                                  </div>
                                </div>
                                {itemIndex < subItems.length - 1 && <div className={styles.divider} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {index < mainCategories.length - 1 && <div className={styles.divider} />}
            </div>
          );
        })}
      </div>

      {/* Middle Column - Sub-Categories */}
      <div className={styles.middleColumn}>
        {selectedCategory && subCategories.length > 0 && (
          <div className={styles.sectionHeader}>Sub-Categories</div>
        )}
        {selectedCategory && subCategories.length > 0 ? (
          subCategories.map((subCategory, index) => {
            const subCategoryName = language === 'ar' ? subCategory.name_l1 : subCategory.name;
            const isSelected = selectedSubCategoryId === subCategory.id;
            const hasChildren = (subCategory.children && subCategory.children.length > 0) ||
              allCategories.some((cat) => cat.parentID === subCategory.id);

            return (
              <div key={subCategory.id}>
                <div
                  className={`${styles.subCategoryRow} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSubCategoryClick(subCategory)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSubCategoryClick(subCategory);
                    }
                  }}
                >
                  <div className={styles.subCategoryRowContent}>
                    <span className={styles.subCategoryName}>{subCategoryName}</span>
                    {hasChildren && (
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
                    )}
                  </div>
                </div>
                {index < subCategories.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })
        ) : selectedCategory ? (
          <div className={styles.emptyState}>No sub-categories available</div>
        ) : (
          <div className={styles.emptyState}>Select a category to view sub-categories</div>
        )}
      </div>

      {/* Right Column - Sub-Items */}
      <div className={styles.rightColumn}>
        {selectedSubCategory && subItems.length > 0 && (
          <div className={styles.sectionHeader}>Items</div>
        )}
        {selectedSubCategory && subItems.length > 0 ? (
          subItems.map((subItem, index) => {
            const subItemName = language === 'ar' ? subItem.name_l1 : subItem.name;

            return (
              <div key={subItem.id}>
                <div
                  className={styles.subItemRow}
                  onClick={() => handleSubItemClick(subItem)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSubItemClick(subItem);
                    }
                  }}
                >
                  <div className={styles.subItemRowContent}>
                    <span className={styles.subItemName}>{subItemName}</span>
                  </div>
                </div>
                {index < subItems.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })
        ) : selectedSubCategoryId && selectedSubCategory ? (
          <div className={styles.emptyState}>No sub-items available</div>
        ) : (
          <div className={styles.emptyState}>
            {selectedCategory ? 'Select a sub-category to view items' : 'Select a category first'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBrowser;

