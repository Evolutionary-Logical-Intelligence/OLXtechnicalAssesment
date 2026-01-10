// API Types
export interface ApiCategory {
  id: number;
  name: string;
  name_l1: string;
  externalID: string;
  slug: string;
  level: number;
  parentID: number | null;
  displayPriority: number;
  purpose: string;
  roles: string[];
  locationDepthLimits: {
    min: number;
    max: number;
  };
  configurations: Record<string, unknown>;
  statistics: {
    activeCount: number;
  };
  paaSections: unknown;
  templateConfigs: unknown;
  templateHashes: unknown;
  children: ApiCategory[];
}

export interface Category {
  id: string;
  label: string;
  slug: string;
  hasDropdown?: boolean;
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.olx.com.lb';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.olx.com.lb';
};

export const fetchCategories = async (): Promise<ApiCategory[]> => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data: ApiCategory[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const convertCategoriesToNavigationFormat = (
  apiCategories: ApiCategory[],
  language: 'en' | 'ar' = 'en'
): Category[] => {
  const topLevelCategories = apiCategories.filter(
    (cat) => cat.level === 0 && cat.parentID === null
  );

  const sortedCategories = topLevelCategories.sort(
    (a, b) => a.displayPriority - b.displayPriority
  );

  const categories: Category[] = sortedCategories.map((cat) => ({
    id: cat.id.toString(),
    label: language === 'ar' ? cat.name_l1 : cat.name,
    slug: cat.slug,
    hasDropdown: false,
  }));

  return [
    {
      id: 'all',
      label: language === 'ar' ? 'جميع الفئات' : 'ALL CATEGORIES',
      slug: 'all',
      hasDropdown: true,
    },
    ...categories,
  ];
};


export const getNavigationCategories = async (
  language: 'en' | 'ar' = 'en'
): Promise<Category[]> => {
  try {
    const apiCategories = await fetchCategories();
    return convertCategoriesToNavigationFormat(apiCategories, language);
  } catch (error) {
    console.error('Error getting navigation categories:', error);
    return [
      { id: 'all', label: language === 'ar' ? 'جميع الفئات' : 'ALL CATEGORIES', slug: 'all', hasDropdown: true },
      { id: 'cars', label: language === 'ar' ? 'سيارات للبيع' : 'Cars for Sale', slug: 'cars' },
    ];
  }
};

