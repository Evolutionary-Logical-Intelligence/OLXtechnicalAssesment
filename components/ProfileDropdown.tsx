import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ProfileDropdown.module.css';

interface ProfileDropdownProps {
  userName?: string;
  isPro?: boolean;
  onMenuItemClick?: (item: string) => void;
}

export default function ProfileDropdown({
  userName = 'User',
  isPro = true,
  onMenuItemClick
}: ProfileDropdownProps) {
  const { translations } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const menuItems = [
    translations.myAccount,
    translations.myAds,
    translations.favorites,
    translations.settings,
    translations.logout
  ];

  const handleItemClick = (item: string) => {
    setIsOpen(false);
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
  };

  return (
    <div className={styles.profileDropdown} ref={dropdownRef} dir="ltr">
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className={styles.profileIconContainer}>
          <div className={styles.profileIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          {isPro && (
            <span className={styles.proBadge}>PRO</span>
          )}
        </div>
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
          <div className={styles.profileHeader}>
            <div className={styles.profileIconSmall}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{userName}</div>
              {isPro && (
                <div className={styles.proBadgeSmall}>PRO</div>
              )}
            </div>
          </div>
          <div className={styles.menuDivider}></div>
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={styles.menuItem}
              onClick={() => handleItemClick(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

