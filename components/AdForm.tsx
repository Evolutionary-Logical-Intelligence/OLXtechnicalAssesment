import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCategoryFields, CategoryField, ApiCategory, FieldChoice } from '../lib/api';
import styles from './AdForm.module.css';

interface AdFormProps {
  categorySlug: string;
  selectedCategory: ApiCategory | null;
  selectedSubCategory: ApiCategory | null;
  selectedSubItem: ApiCategory | null;
}

const AdForm: React.FC<AdFormProps> = ({
  categorySlug,
  selectedCategory,
  selectedSubCategory,
  selectedSubItem,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [childrenFields, setChildrenFields] = useState<Record<string, Record<string, FieldChoice[]>>>({});
  const [parentFieldLookup, setParentFieldLookup] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadFields = async () => {
      if (!categorySlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchCategoryFields(categorySlug);
        
        const categoryKey = Object.keys(response)[0];
        if (categoryKey && response[categoryKey]) {
          const categoryData = response[categoryKey];
          setFields(categoryData.flatFields || []);
          const childrenFieldsData = categoryData.childrenFields || {};
          const nestedChildrenFields: Record<string, Record<string, FieldChoice[]>> = {};
          Object.keys(childrenFieldsData).forEach((key) => {
            const value = (childrenFieldsData as any)[key];
            if (Array.isArray(value)) {
              nestedChildrenFields[key] = { '': value };
            } else if (typeof value === 'object' && value !== null) {
              nestedChildrenFields[key] = value as Record<string, FieldChoice[]>;
            }
          });
          setChildrenFields(nestedChildrenFields);
          setParentFieldLookup(categoryData.parentFieldLookup || {});
        }
      } catch (err) {
        setError('Failed to load form fields');
        console.error('Error loading category fields:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [categorySlug]);

  const handleFieldChange = (attribute: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [attribute]: value,
    }));

    // Clear dependent fields when parent changes
    const dependentField = parentFieldLookup[attribute];
    if (dependentField && formData[dependentField]) {
      setFormData((prev) => {
        const updated = { ...prev };
        delete updated[dependentField];
        return updated;
      });
    }
  };

  const getCategoryMainName = () => {
    if (selectedCategory) {
      return language === 'ar' ? selectedCategory.name_l1 : selectedCategory.name;
    }
    return '';
  };

  const getCategorySubName = () => {
    if (selectedSubItem) {
      return language === 'ar' ? selectedSubItem.name_l1 : selectedSubItem.name;
    }
    if (selectedSubCategory) {
      return language === 'ar' ? selectedSubCategory.name_l1 : selectedSubCategory.name;
    }
    return '';
  };

  const getCategoryIconUrl = () => {
    const category = selectedSubItem || selectedSubCategory || selectedCategory;
    if (category) {
      return `/categoryicons/${category.slug}.png`;
    }
    return '/categoryIcons/vehicle.png';
  };

  const getFieldLabel = (field: CategoryField) => {
    return field.name;
  };

  const getFieldChoices = (field: CategoryField, parentValue?: string) => {
    if (field.attribute === 'model' && parentValue && childrenFields[field.attribute]) {
      return childrenFields[field.attribute][parentValue] || [];
    }
    return field.choices || [];
  };

  const renderField = (field: CategoryField) => {
    if (field.state !== 'active' || field.roles.includes('exclude_from_post_an_ad')) {
      return null;
    }

    const fieldLabel = getFieldLabel(field);
    const isRequired = field.isMandatory;
    const fieldValue = formData[field.attribute];

    // Handle different field types
    if (field.valueType === 'enum' && field.filterType === 'single_choice') {
      const choices = getFieldChoices(field, formData[parentFieldLookup[field.attribute] || '']);
      
      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabel}>
            {fieldLabel}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.fieldInputWrapper}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.textInput}
                placeholder={`Select ${fieldLabel.toLowerCase()}`}
                value={fieldValue || ''}
                readOnly
                onClick={() => {
                  console.log('Open selection for:', field.attribute);
                }}
              />
              <svg
                className={styles.searchIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (field.valueType === 'enum' && field.filterType === 'multiple_choice') {
      if (field.attribute === 'new_used' || field.attribute === 'condition') {
        const choices = field.choices || [];
        return (
          <div key={field.id} className={styles.formField}>
            <label className={styles.fieldLabel}>
              {fieldLabel}
              {isRequired && <span className={styles.required}>*</span>}
            </label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.buttonGroup}>
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={`${styles.choiceButton} ${fieldValue === choice.value ? styles.selected : ''}`}
                    onClick={() => handleFieldChange(field.attribute, choice.value)}
                  >
                    {language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (field.attribute === 'price_type') {
        const choices = field.choices || [];
        return (
          <div key={field.id} className={styles.formField}>
            <label className={styles.fieldLabel}>
              {fieldLabel}
              {isRequired && <span className={styles.required}>*</span>}
            </label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.checkboxGroup}>
                {choices.map((choice) => (
                  <label key={choice.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={Array.isArray(fieldValue) && fieldValue.includes(choice.value)}
                      onChange={(e) => {
                        const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                        if (e.target.checked) {
                          handleFieldChange(field.attribute, [...currentValues, choice.value]);
                        } else {
                          handleFieldChange(field.attribute, currentValues.filter((v) => v !== choice.value));
                        }
                      }}
                    />
                    <span>{language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      }
    }

    if (field.valueType === 'float' && field.attribute === 'price') {
      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabel}>
            {fieldLabel}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.fieldInputWrapper}>
            <div className={styles.segmentedInput}>
              <div className={styles.segmentLeft}>USD</div>
              <input
                type="number"
                className={`${styles.segmentRight} ${isRequired && !fieldValue ? styles.error : ''}`}
                placeholder="Enter Price"
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
                min={field.minValue || undefined}
                max={field.maxValue || undefined}
              />
            </div>
            {isRequired && !fieldValue && (
              <div className={styles.errorMessage}>This field is required</div>
            )}
          </div>
        </div>
      );
    }

    if (field.valueType === 'float' && field.attribute === 'secondary_price') {
      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabelOptional}>Optional price</label>
          <div className={styles.fieldInputWrapper}>
            <div className={styles.segmentedInput}>
              <div className={styles.segmentLeft}>LBP</div>
              <input
                type="number"
                className={styles.segmentRightOptional}
                placeholder="Enter Optional price"
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
                min={field.minValue || undefined}
                max={field.maxValue || undefined}
              />
            </div>
          </div>
        </div>
      );
    }

    if (field.valueType === 'string' || field.filterType === 'text') {
      const maxLength = field.maxLength || undefined;
      const currentLength = fieldValue ? String(fieldValue).length : 0;

      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabel}>
            {fieldLabel}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.fieldInputWrapper}>
            {field.attribute === 'description' ? (
              <>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe the item you're selling"
                  value={fieldValue || ''}
                  onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
                  maxLength={maxLength}
                  rows={6}
                />
                <div className={styles.fieldHint}>
                  Include condition, features and reason for selling
                </div>
                {maxLength && (
                  <div className={styles.charCounter}>
                    {currentLength}/{maxLength}
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder={field.attribute === 'title' ? 'Enter title' : `Enter ${fieldLabel.toLowerCase()}`}
                  value={fieldValue || ''}
                  onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
                  maxLength={maxLength}
                />
                {field.attribute === 'title' && (
                  <>
                    <div className={styles.fieldHint}>
                      Mention the key features of your item (e.g. brand, model, age, type)
                    </div>
                    {maxLength && (
                      <div className={styles.charCounter}>
                        {currentLength}/{maxLength}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const sortedFields = [...fields].sort((a, b) => a.displayPriority - b.displayPriority);

  const visibleFields = sortedFields.filter(
    (field) => !field.roles.includes('exclude_from_post_an_ad')
  );

  if (loading) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.loading}>Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!categorySlug) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.error}>Please select a category first</div>
      </div>
    );
  }

  const categoryMainName = getCategoryMainName();
  const categorySubName = getCategorySubName();
  const categoryIconUrl = getCategoryIconUrl();

  return (
    <div className={styles.formContainer}>
      {/* Category Section */}
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>Category</label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.categoryDisplay}>
            <div className={styles.categoryInfo}>
              <div className={styles.categoryIconWrapper}>
                <img
                  src={categoryIconUrl}
                  alt={categoryMainName}
                  className={styles.categoryIcon}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/categoryIcons/vehicle.png';
                  }}
                />
              </div>
              <div className={styles.categoryText}>
                <div className={styles.categoryMain}>{categoryMainName}</div>
                {categorySubName && (
                  <div className={styles.categorySub}>{categorySubName}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              className={styles.changeButton}
              onClick={() => router.push('/post')}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Upload Images Section */}
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>Upload Images</label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.imageUploadGrid}>
            <button 
              type="button" 
              className={styles.imageUploadButton}
              aria-label="Add image"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            {Array.from({ length: 11 }).map((_, index) => (
              <button 
                key={index} 
                type="button" 
                className={styles.imageSlot}
                aria-label={`Image slot ${index + 1}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21"></path>
                </svg>
              </button>
            ))}
          </div>
          <div className={styles.imageHint}>
            For the cover picture we recommend using the landscape mode.
          </div>
        </div>
      </div>

      {/* Border after Upload Images */}
      <div className={styles.sectionBorder}></div>

      {/* Brand Field - Always show, from API or global */}
      {(() => {
        const brandField = visibleFields.find(f => f.attribute === 'make' || f.attribute === 'brand');
        if (brandField) {
          return renderField(brandField);
        }
        // Global Brand field if not in API
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Brand
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Select brand"
                  value={formData.brand || formData.make || ''}
                  readOnly
                  onClick={() => {
                    console.log('Open brand selection');
                  }}
                />
                <svg
                  className={styles.searchIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Border after Brand */}
      <div className={styles.sectionBorder}></div>

      {/* Model Field - Always show, from API or global */}
      {(() => {
        const modelField = visibleFields.find(f => f.attribute === 'model');
        const fieldValue = formData.model || '';
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Model
            </label>
            <div className={styles.fieldInputWrapper}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter model"
                value={fieldValue}
                onChange={(e) => handleFieldChange('model', e.target.value)}
              />
            </div>
          </div>
        );
      })()}

      {/* Condition Field - Always show, from API or global */}
      {(() => {
        const conditionField = visibleFields.find(f => f.attribute === 'new_used' || f.attribute === 'condition');
        if (conditionField) {
          return renderField(conditionField);
        }
        // Global Condition field if not in API
        const conditionValue = formData.condition || formData.new_used || '';
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Condition</label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.buttonGroup}>
                {['New', 'Used', 'Refurbished'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.choiceButton} ${conditionValue === option.toLowerCase() ? styles.selected : ''}`}
                    onClick={() => handleFieldChange('condition', option.toLowerCase())}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Storage Field - Always show, from API or global */}
      {(() => {
        const storageField = visibleFields.find(f => f.attribute === 'storage');
        if (storageField) {
          return renderField(storageField);
        }
        // Global Storage field if not in API
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Storage</label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Select storage"
                  value={formData.storage || ''}
                  readOnly
                  onClick={() => {
                    console.log('Open storage selection');
                  }}
                />
                <svg
                  className={styles.searchIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Color Field - Always show, from API or global */}
      {(() => {
        const colorField = visibleFields.find(f => f.attribute === 'color');
        if (colorField) {
          return renderField(colorField);
        }
        // Global Color field if not in API
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Color</label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Select color"
                  value={formData.color || ''}
                  readOnly
                  onClick={() => {
                    console.log('Open color selection');
                  }}
                />
                <svg
                  className={styles.searchIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ad Title Field - Always show, global */}
      {(() => {
        const titleField = visibleFields.find(f => f.attribute === 'title');
        const fieldValue = formData.title || '';
        const maxLength = titleField?.maxLength || 70;
        const currentLength = fieldValue ? String(fieldValue).length : 0;
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Ad title
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldInputWrapper}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter title"
                value={fieldValue}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                maxLength={maxLength}
              />
              <div className={styles.fieldHint}>
                Mention the key features of your item (e.g. brand, model, age, type)
              </div>
              <div className={styles.charCounter}>
                {currentLength}/{maxLength}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Description Field - Always show, global */}
      {(() => {
        const descField = visibleFields.find(f => f.attribute === 'description');
        const fieldValue = formData.description || '';
        const maxLength = descField?.maxLength || 4096;
        const currentLength = fieldValue ? String(fieldValue).length : 0;
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Description
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldInputWrapper}>
              <textarea
                className={styles.textarea}
                placeholder="Describe the item you're selling"
                value={fieldValue}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                maxLength={maxLength}
                rows={6}
              />
              <div className={styles.fieldHint}>
                Include condition, features and reason for selling
              </div>
              <div className={styles.charCounter}>
                {currentLength}/{maxLength}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Location Field */}
      <div className={styles.formField}>
        <label className={styles.fieldLabel}>
          Location
          <span className={styles.required}>*</span>
        </label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Select Location"
              value={formData.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
            />
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Border after Location */}
      <div className={styles.sectionBorder}></div>

      {/* Price Field - Always show, from API or global */}
      {(() => {
        const priceField = visibleFields.find(f => f.attribute === 'price');
        const priceValue = formData.price || '';
        const minValue = priceField?.minValue;
        const maxValue = priceField?.maxValue;
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabelOptional}>
              Price
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.segmentedInput}>
                <div className={styles.segmentLeft}>USD</div>
                <input
                  type="number"
                  className={`${styles.segmentRightOptional} ${priceValue ? styles.hasCheckIcon : ''}`}
                  placeholder="Enter Price"
                  value={priceValue}
                  onChange={(e) => handleFieldChange('price', e.target.value)}
                  min={minValue || undefined}
                  max={maxValue || undefined}
                />
                {priceValue && (
                  <svg
                    className={styles.checkIcon}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Optional Price Field - Always show, from API or global */}
      {(() => {
        const secondaryPriceField = visibleFields.find(f => f.attribute === 'secondary_price');
        const secondaryPriceValue = formData.secondary_price || '';
        const minValue = secondaryPriceField?.minValue;
        const maxValue = secondaryPriceField?.maxValue;
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabelOptional}>Optional price</label>
            <div className={styles.fieldInputWrapper}>
              <div className={styles.segmentedInput}>
                <div className={styles.segmentLeft}>LBP</div>
                <input
                  type="number"
                  className={styles.segmentRightOptional}
                  placeholder="Enter Optional price"
                  value={secondaryPriceValue}
                  onChange={(e) => handleFieldChange('secondary_price', e.target.value)}
                  min={minValue || undefined}
                  max={maxValue || undefined}
                />
              </div>
              {/* Price Type Checkboxes - Negotiable, Exchange, Free */}
              <div className={styles.checkboxGroup}>
                {(() => {
                  const priceTypeField = visibleFields.find(f => f.attribute === 'price_type');
                  if (priceTypeField && priceTypeField.choices) {
                    const priceTypeChoices = priceTypeField.choices.filter(c => 
                      c.value === 'arranged' || c.value === 'exchange' || c.value === 'free'
                    );
                    const priceTypeValue = formData.price_type || '';
                    return priceTypeChoices.map((choice) => (
                      <label key={choice.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={priceTypeValue === choice.value || (Array.isArray(priceTypeValue) && priceTypeValue.includes(choice.value))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // For single choice, set the value directly
                              handleFieldChange('price_type', choice.value);
                            } else {
                              handleFieldChange('price_type', '');
                            }
                          }}
                        />
                        <span>{language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label}</span>
                      </label>
                    ));
                  }
                  // Global checkboxes if not in API
                  const priceTypeValue = formData.price_type || '';
                  return (
                    <>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={priceTypeValue === 'arranged' || priceTypeValue === 'negotiable'}
                          onChange={(e) => {
                            handleFieldChange('price_type', e.target.checked ? 'arranged' : '');
                          }}
                        />
                        <span>Negotiable</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={priceTypeValue === 'exchange'}
                          onChange={(e) => {
                            handleFieldChange('price_type', e.target.checked ? 'exchange' : '');
                          }}
                        />
                        <span>Exchange</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={priceTypeValue === 'free'}
                          onChange={(e) => {
                            handleFieldChange('price_type', e.target.checked ? 'free' : '');
                          }}
                        />
                        <span>Free</span>
                      </label>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delivery Toggle */}
      <div className={styles.formField}>
        <label className={styles.fieldLabel} htmlFor="delivery-toggle">DELIVERY</label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.toggleWrapper}>
            <label className={styles.toggleSwitch} htmlFor="delivery-toggle">
              <input
                id="delivery-toggle"
                type="checkbox"
                checked={formData.delivery || false}
                onChange={(e) => handleFieldChange('delivery', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
            <div className={styles.toggleText}>
              Deliver your items using{' '}
              <a href="#" className={styles.toggleLink}>Pik&Drop</a>
              {' '} - Dubizzle Lebanon's exclusive delivery partner or through{' '}
              <a href="#" className={styles.toggleLink}>Self-Delivery</a>
            </div>
          </div>
        </div>
      </div>

      {/* Border after Delivery */}
      <div className={styles.sectionBorder}></div>

      {/* Render remaining fields */}
      {visibleFields
        .filter(f => 
          f.attribute !== 'make' && 
          f.attribute !== 'brand' && 
          f.attribute !== 'model' && 
          f.attribute !== 'new_used' && 
          f.attribute !== 'condition' && 
          f.attribute !== 'storage' && 
          f.attribute !== 'color' && 
          f.attribute !== 'title' && 
          f.attribute !== 'description' &&
          f.attribute !== 'price' &&
          f.attribute !== 'secondary_price' &&
          f.attribute !== 'price_type'
        )
        .map((field) => renderField(field))}

      <div className={styles.formField}>
        <label className={styles.fieldLabel}>
          Name
          <span className={styles.required}>*</span>
        </label>
        <div className={styles.fieldInputWrapper}>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Enter your name"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel}>
          Mobile Phone Number
          <span className={styles.required}>*</span>
        </label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.segmentedInput}>
            <div className={styles.segmentLeft}>+961</div>
            <input
              type="tel"
              className={styles.segmentRight}
              placeholder="Enter phone number"
              value={formData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.fieldLabel}>Contact Method</label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.choiceButton} ${formData.contactMethod === 'phone' ? styles.selected : ''}`}
              onClick={() => handleFieldChange('contactMethod', 'phone')}
            >
              Phone Number
            </button>
            <button
              type="button"
              className={`${styles.choiceButton} ${formData.contactMethod === 'chat' ? styles.selected : ''}`}
              onClick={() => handleFieldChange('contactMethod', 'chat')}
            >
              OLX Chat
            </button>
            <button
              type="button"
              className={`${styles.choiceButton} ${formData.contactMethod === 'both' ? styles.selected : ''}`}
              onClick={() => handleFieldChange('contactMethod', 'both')}
            >
              Both
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdForm;

