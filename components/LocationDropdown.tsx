import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './LocationDropdown.module.css';

interface Location {
  id: string;
  name: string;
  nameAr: string;
}

interface LocationDropdownProps {
  selectedLocation?: string;
  locations?: Location[];
  onLocationChange?: (location: string) => void;
}

export default function LocationDropdown({
  selectedLocation,
  locations,
  onLocationChange
}: LocationDropdownProps) {
  const { translations, language } = useLanguage();
  
  const defaultLocations: Location[] = [
    { id: '1', name: translations.locations.lebanon, nameAr: translations.locations.lebanon },
    { id: '2', name: translations.locations.beirut, nameAr: translations.locations.beirut },
    { id: '3', name: translations.locations.tripoli, nameAr: translations.locations.tripoli },
    { id: '4', name: translations.locations.sidon, nameAr: translations.locations.sidon },
    { id: '5', name: translations.locations.tyre, nameAr: translations.locations.tyre },
  ];

  const locationsList = locations || defaultLocations;
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    return selectedLocation || translations.locations.lebanon;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLocation) {
      setSelected(selectedLocation);
    } else {
      setSelected(translations.locations.lebanon);
    }
  }, [selectedLocation, translations.locations.lebanon, language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (location: Location) => {
    const locationName = language === 'ar' ? location.nameAr : location.name;
    setSelected(locationName);
    setIsOpen(false);
    if (onLocationChange) {
      onLocationChange(locationName);
    }
  };

  return (
    <div className={styles.locationDropdown} ref={dropdownRef} dir="ltr">
      <button
        className={styles.locationButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.locationIcon}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </span>
        <span className={styles.locationText}>{selected}</span>
        <span className={styles.chevron}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {locationsList.map((location) => {
            const locationName = language === 'ar' ? location.nameAr : location.name;
            return (
              <button
                key={location.id}
                className={`${styles.dropdownItem} ${selected === locationName ? styles.active : ''}`}
                onClick={() => handleSelect(location)}
                type="button"
              >
                {locationName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

