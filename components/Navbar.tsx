import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LocationDropdown from './LocationDropdown';
import SearchBar from './SearchBar';
import ProfileDropdown from './ProfileDropdown';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { translations, toggleLanguage, language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState(translations.locations.lebanon);

  useEffect(() => {
    setSelectedLocation(translations.locations.lebanon);
  }, [translations.locations.lebanon]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    console.log('Location changed to:', location);
  };

  const handleProfileMenuClick = (item: string) => {
    console.log('Menu item clicked:', item);
  };

  return (
    <nav className={styles.navbar} dir="ltr">
      <div className={styles.navbarContainer}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoText}>{translations.logo}</span>
        </div>

        {/* Location Dropdown */}
        <div className={styles.locationSection}>
          <LocationDropdown
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
          />
        </div>

        {/* Search Bar */}
        <div className={styles.searchSection}>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Right side items */}
        <div className={styles.rightSection}>
          {/* Language Selector */}
          <button 
            className={styles.languageButton} 
            type="button"
            onClick={toggleLanguage}
          >
            <span className={styles.languageText}>{translations.language}</span>
          </button>

          {/* Message Icon */}
          <button 
            className={styles.iconButton} 
            type="button" 
            aria-label={translations.messages}
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
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          {/* Notification Icon */}
          <button 
            className={styles.iconButton} 
            type="button" 
            aria-label={translations.notifications}
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
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>

          {/* Profile Dropdown */}
          <ProfileDropdown
            userName="User"
            isPro={true}
            onMenuItemClick={handleProfileMenuClick}
          />

          {/* Sell Button */}
          <button className={styles.sellButton} type="button">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{translations.sell}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

