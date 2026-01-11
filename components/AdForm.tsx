import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCategoryFields, CategoryField, ApiCategory, FieldChoice } from '../lib/api';
import styles from './AdForm.module.css';
import Image from 'next/image'; 
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadFields = async () => {
      if (!categorySlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.olx.com.lb';
        const apiUrl = `${baseUrl}/api/categoryFields?categorySlugs=${categorySlug}&includeChildCategories=true&splitByCategoryIDs=true&flatChoices=true&groupChoicesBySection=true&flat=true`;
        console.log('API URL:', apiUrl);
        
        const response = await fetchCategoryFields(categorySlug);
        
        console.log('API Response:', response);
        
        const categoryKey = Object.keys(response)[0];
        if (categoryKey && response[categoryKey]) {
          const categoryData = response[categoryKey];
          const flatFields = categoryData.flatFields || [];
          
          console.log('Total fields loaded:', flatFields.length);
          const storageField = flatFields.find(f => f.attribute === 'storage');
          const colorField = flatFields.find(f => f.attribute === 'color');
          const makeField = flatFields.find(f => f.attribute === 'make');
          console.log('Storage field found:', !!storageField, 'Choices:', storageField?.choices?.length || 0);
          if (storageField?.choices) {
            console.log('Storage choices:', storageField.choices);
          }
          console.log('Color field found:', !!colorField, 'Choices:', colorField?.choices?.length || 0);
          if (colorField?.choices) {
            console.log('Color choices:', colorField.choices);
          }
          console.log('Make field found:', !!makeField, 'Choices:', makeField?.choices?.length || 0);
          if (makeField?.choices) {
            console.log('Make choices:', makeField.choices);
          }
          
          setFields(flatFields);
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

    const dependentField = parentFieldLookup[attribute];
    if (dependentField && formData[dependentField]) {
      setFormData((prev) => {
        const updated = { ...prev };
        delete updated[dependentField];
        return updated;
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const maxImages = 12;
    const remainingSlots = maxImages - uploadedImages.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('Image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setUploadedImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = (index: number) => {
    if (uploadedImages[index]) {
      setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedInside = false;

      Object.keys(openDropdowns).forEach((fieldAttribute) => {
        if (openDropdowns[fieldAttribute]) {
          const ref = dropdownRefs.current[fieldAttribute];
          if (ref && ref.contains(target)) {
            clickedInside = true;
            return;
          }
        }
      });

      if (!clickedInside) {
        setOpenDropdowns((prev) => {
          const newState: Record<string, boolean> = {};
          let hasChanges = false;
          Object.keys(prev).forEach((key) => {
            if (prev[key]) {
              newState[key] = false;
              hasChanges = true;
            }
          });
          return hasChanges ? newState : prev;
        });
      }
    };

    const hasOpenDropdowns = Object.values(openDropdowns).some((isOpen) => isOpen);
    if (hasOpenDropdowns) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [openDropdowns]);

  const toggleDropdown = (fieldAttribute: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldAttribute]: !prev[fieldAttribute],
    }));
  };

  const handleChoiceSelect = (fieldAttribute: string, choice: FieldChoice) => {
    handleFieldChange(fieldAttribute, choice.value);
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldAttribute]: false,
    }));
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

    if (field.valueType === 'enum' && field.filterType === 'single_choice') {
      const choices = getFieldChoices(field, formData[parentFieldLookup[field.attribute] || '']);
      const hasChoices = choices && Array.isArray(choices) && choices.length > 0;
      
      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabel}>
            {fieldLabel}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.fieldInputWrapper}>
            <select
              className={styles.selectInput}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
              required={isRequired}
              aria-label={fieldLabel}
            >
              <option value="">{`Select ${fieldLabel.toLowerCase()}`}</option>
              {hasChoices ? choices.map((choice) => {
                const choiceLabel = language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label;
                return (
                  <option key={choice.id || choice.value} value={choice.value}>
                    {choiceLabel}
                  </option>
                );
              }) : null}
            </select>
          </div>
        </div>
      );
    }

    if ((field.valueType === 'enum' || field.valueType === 'enum_multiple') && field.filterType === 'multiple_choice') {
      const choices = field.choices || [];
      
      if (field.attribute === 'new_used' || field.attribute === 'condition') {
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

    if (field.valueType === 'float' || field.valueType === 'integer') {
      if (field.attribute === 'price') {
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

      if (field.attribute === 'secondary_price') {
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

      // Regular number input for other float/integer fields (like ft, rooms, bathrooms)
      return (
        <div key={field.id} className={styles.formField}>
          <label className={styles.fieldLabel}>
            {fieldLabel}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
          <div className={styles.fieldInputWrapper}>
            <input
              type="number"
              className={styles.textInput}
              placeholder={`Enter ${fieldLabel.toLowerCase()}`}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.attribute, e.target.value)}
              min={field.minValue || undefined}
              max={field.maxValue || undefined}
              required={isRequired}
            />
            {isRequired && !fieldValue && (
              <div className={styles.errorMessage}>This field is required</div>
            )}
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

  const isPropertiesCategory = categorySlug?.toLowerCase().includes('property') || 
                                categorySlug?.toLowerCase().includes('real-estate') ||
                                selectedCategory?.slug?.toLowerCase().includes('property') ||
                                selectedCategory?.name?.toLowerCase().includes('property') ||
                                selectedCategory?.name?.toLowerCase().includes('real estate');

  const propertyTypeField = visibleFields.find(f => f.attribute === 'property_type');
  const roomsField = visibleFields.find(f => f.attribute === 'rooms');
  const bathroomsField = visibleFields.find(f => f.attribute === 'bathrooms');
  const ftField = visibleFields.find(f => f.attribute === 'ft');
  const furnishedField = visibleFields.find(f => f.attribute === 'furnished');
  const conditionField = visibleFields.find(f => f.attribute === 'condition');
  const floorLevelField = visibleFields.find(f => f.attribute === 'floor_level');
  const featuresField = visibleFields.find(f => f.attribute === 'features');
  const propertyAgeField = visibleFields.find(f => f.attribute === 'property_age');
  const ownershipField = visibleFields.find(f => f.attribute === 'ownership');
  const paymentOptionField = visibleFields.find(f => f.attribute === 'payment_option');

  return (
    <>
    <div className={styles.formContainer}>
      {/* Category Section */}
      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>Category</label>
        <div className={styles.fieldInputWrapper}>
          <div className={styles.categoryDisplay}>
            <div className={styles.categoryInfo}>
              <div className={styles.categoryIconWrapper}>
                <Image
                  src={categoryIconUrl}
                  alt={categoryMainName}
                  className={styles.categoryIcon}
                  width={48}
                  height={48}
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

      <div className={styles.formSection}>
        <label className={styles.fieldLabel}>Upload Images</label>
        <div className={styles.fieldInputWrapper}>
          <input
            ref={fileInputRef}
            type="file"
            accept="Image/*"
            multiple
            onChange={handleImageUpload}
            className={styles.hiddenFileInput}
            aria-label="Upload Images"
          />
          <div className={styles.ImageUploadGrid}>
            {uploadedImages.length < 12 && (
              <button 
                type="button" 
                className={styles.ImageUploadButton}
                aria-label="Add Image"
                onClick={() => fileInputRef.current?.click()}
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
            )}
            {Array.from({ length: 12 }).map((_, index) => {
              const ImageUrl = uploadedImages[index];
              if (index === 0 && !ImageUrl && uploadedImages.length === 0) {
                return null;
              }
              if (ImageUrl) {
                return (
                  <div key={index} className={styles.ImagePreviewContainer}>
                    <Image
                      src={ImageUrl}
                      alt={`Upload ${index + 1}`}
                      className={styles.ImagePreview}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <button
                      type="button"
                      className={styles.ImageRemoveButton}
                      onClick={() => handleRemoveImage(index)}
                      aria-label={`Remove Image ${index + 1}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                );
              }
              return (
                <button 
                  key={index} 
                  type="button" 
                  className={styles.ImageSlot}
                  aria-label={`Image slot ${index + 1}`}
                  onClick={() => fileInputRef.current?.click()}
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
              );
            })}
          </div>
          <div className={styles.ImageHint}>
            For the cover picture we recommend using the landscape mode.
          </div>
        </div>
      </div>

      <div className={styles.sectionBorder}></div>

      {(() => {
        const brandField = fields.find(f => f.attribute === 'make' || f.attribute === 'brand');
        const brandChoices = brandField?.choices || [];
        console.log('Brand field render - Field found:', !!brandField, 'Choices count:', brandChoices.length);
        
        if (brandField && brandChoices.length > 0) {
          const isInVisibleFields = visibleFields.some(f => f.attribute === 'make' || f.attribute === 'brand');
          if (isInVisibleFields) {
            return renderField(brandField);
          }
        }
        
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Brand
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldInputWrapper}>
              <select
                className={styles.selectInput}
                value={formData.brand || formData.make || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                required
                aria-label="Brand"
              >
                <option value="">Select brand</option>
                {brandChoices.length > 0 ? brandChoices.map((choice) => {
                  const choiceLabel = language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label;
                  return (
                    <option key={choice.id || choice.value} value={choice.value}>
                      {choiceLabel}
                    </option>
                  );
                }) : null}
              </select>
            </div>
          </div>
        );
      })()}

      <div className={styles.sectionBorder}></div>

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

      {(() => {
        const conditionField = visibleFields.find(f => f.attribute === 'new_used' || f.attribute === 'condition');
        if (conditionField) {
          return renderField(conditionField);
        }
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

      {(() => {
        const storageField = fields.find(f => f.attribute === 'storage');
        const storageChoices = storageField?.choices || [];
        console.log('Storage field render - Field found:', !!storageField, 'Choices count:', storageChoices.length);
        
        if (storageField && storageChoices.length > 0) {
          const isInVisibleFields = visibleFields.some(f => f.attribute === 'storage');
          if (isInVisibleFields) {
            return renderField(storageField);
          }
        }
        
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Storage</label>
            <div className={styles.fieldInputWrapper}>
              <select
                className={styles.selectInput}
                value={formData.storage || ''}
                onChange={(e) => handleFieldChange('storage', e.target.value)}
                aria-label="Storage"
              >
                <option value="">Select storage</option>
                {storageChoices.length > 0 ? storageChoices.map((choice) => {
                  const choiceLabel = language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label;
                  return (
                    <option key={choice.id || choice.value} value={choice.value}>
                      {choiceLabel}
                    </option>
                  );
                }) : null}
              </select>
            </div>
          </div>
        );
      })()}

      {(() => {
        const colorField = fields.find(f => f.attribute === 'color');
        const colorChoices = colorField?.choices || [];
        console.log('Color field render - Field found:', !!colorField, 'Choices count:', colorChoices.length);
        
        if (colorField && colorChoices.length > 0) {
          const isInVisibleFields = visibleFields.some(f => f.attribute === 'color');
          if (isInVisibleFields) {
            return renderField(colorField);
          }
        }
        
        return (
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Color</label>
            <div className={styles.fieldInputWrapper}>
              <select
                className={styles.selectInput}
                value={formData.color || ''}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                aria-label="Color"
              >
                <option value="">Select color</option>
                {colorChoices.length > 0 ? colorChoices.map((choice) => {
                  const choiceLabel = language === 'ar' && choice.label_l1 ? choice.label_l1 : choice.label;
                  return (
                    <option key={choice.id || choice.value} value={choice.value}>
                      {choiceLabel}
                    </option>
                  );
                }) : null}
              </select>
            </div>
          </div>
        );
      })()}

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

      <div className={styles.sectionBorder}></div>

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
              {' '} - Dubizzle Lebanon&apos;s exclusive delivery partner or through{' '}
              <a href="#" className={styles.toggleLink}>Self-Delivery</a>
            </div>
          </div>
        </div>
      </div>

      {/* Border after Delivery */}
      <div className={styles.sectionBorder}></div>

      {/* Property-specific fields */}
      {isPropertiesCategory && (
        <>
          {/* Property Type */}
          {propertyTypeField && renderField(propertyTypeField)}

          {/* Ownership */}
          {ownershipField && renderField(ownershipField)}

          {/* Rooms */}
          {roomsField && renderField(roomsField)}

          {/* Bathrooms */}
          {bathroomsField && renderField(bathroomsField)}

          {/* Square Feet (ft) */}
          {ftField && renderField(ftField)}

          {/* Furnished */}
          {furnishedField && renderField(furnishedField)}

          {/* Condition */}
          {conditionField && renderField(conditionField)}

          {/* Floor Level */}
          {floorLevelField && renderField(floorLevelField)}

          {/* Features */}
          {featuresField && renderField(featuresField)}

          {/* Property Age */}
          {propertyAgeField && renderField(propertyAgeField)}

          {/* Payment Option */}
          {paymentOptionField && renderField(paymentOptionField)}
        </>
      )}

      {/* Render remaining fields (excluding already rendered ones) */}
      {visibleFields
        .filter(f => {
          // Exclude mobile phone specific fields
          if (f.attribute === 'make' || 
              f.attribute === 'brand' || 
              f.attribute === 'model' || 
              f.attribute === 'storage' || 
              f.attribute === 'color') {
            return false;
          }
          // Exclude common fields
          if (f.attribute === 'title' || 
              f.attribute === 'description' ||
              f.attribute === 'price' ||
              f.attribute === 'secondary_price' ||
              f.attribute === 'price_type') {
            return false;
          }
          // Exclude property fields if we're in properties category (already rendered above)
          if (isPropertiesCategory && (
            f.attribute === 'property_type' ||
            f.attribute === 'rooms' ||
            f.attribute === 'bathrooms' ||
            f.attribute === 'ft' ||
            f.attribute === 'furnished' ||
            f.attribute === 'condition' ||
            f.attribute === 'floor_level' ||
            f.attribute === 'features' ||
            f.attribute === 'property_age' ||
            f.attribute === 'ownership' ||
            f.attribute === 'payment_option'
          )) {
            return false;
          }
          // Exclude condition/new_used if not properties (handled separately)
          if (!isPropertiesCategory && (f.attribute === 'new_used' || f.attribute === 'condition')) {
            return false;
          }
          return true;
        })
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

    {/* Post Now Button - Outside form border */}
    <div className={styles.postButtonContainer}>
      <button
        type="button"
        className={styles.postButton}
        onClick={() => {
          console.log('Post now clicked', formData);
          // TODO: Implement form submission logic
        }}
      >
        Post now
      </button>
    </div>
    </>
  );
};

export default AdForm;

