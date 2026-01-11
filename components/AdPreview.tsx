import React from 'react';
import styles from './AdPreview.module.css';

const AdPreview: React.FC = () => {
  return (
    <div className={styles.helpContainer}>
      <div className={styles.helpCard}>
        <h2 className={styles.helpHeading}>Need help getting started?</h2>
        <p className={styles.helpIntro}>
          Review these resource to learn how to create a great ad and increase your selling chances
        </p>
        <ul className={styles.helpList}>
          <li>
            <a href="#" className={styles.helpLink}>
              Tips for Improving your ads and your chances of selling
            </a>
          </li>
          <li>
            <a href="#" className={styles.helpLink}>
              All you need to know about Posting Ads
            </a>
          </li>
        </ul>
        <p className={styles.helpFooter}>
          You can always come back to change your ad
        </p>
      </div>
    </div>
  );
};

export default AdPreview;

