import React from 'react';
import { useRouter } from 'next/router';
import styles from './PostAdNavigation.module.css';

const PostAdNavigation: React.FC = () => {
  const router = useRouter();

  const handleBackClick = () => {
    if (router.pathname === '/post/category/[categoryId]' || router.asPath.startsWith('/post/category/')) {
      router.push('/post');
    } else if (router.pathname === '/post') {
      router.push('/');
    } else {
      router.back();
    }
  };

  return (
    <nav className={styles.navigation} aria-label="Post Ad Navigation">
      <div className={styles.navigationContainer}>
        <button
          className={styles.backButton}
          onClick={handleBackClick}
          type="button"
          aria-label="Go back"
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
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className={styles.logo}>
          <span className={styles.logoText}>
            <span className={styles.logoO}>O</span>
            <span>lx</span>
          </span>
        </div>
      </div>
    </nav>
  );
};

export default PostAdNavigation;

