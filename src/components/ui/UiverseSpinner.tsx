import React from 'react';
import styles from './UiverseSpinner.module.css';

interface UiverseSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  centered?: boolean;
}

const sizeMap = {
  sm: '16px',
  md: '28px',
  lg: '40px'
};

export const UiverseSpinner: React.FC<UiverseSpinnerProps> = ({ size = 'md', className = '', centered = false }) => {
  return (
    <div 
      className={`${className} ${centered ? styles.center : ''}`} 
      style={{ 
        fontSize: sizeMap[size], 
        position: centered ? 'absolute' : 'relative' 
      }}
    >
      <div className={styles.spinner}>
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
      </div>
    </div>
  );
};

// Simple version without wrapper
export const SimpleUiverseSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  return (
    <div 
      className={className} 
      style={{ fontSize: sizeMap[size] }}
    >
      <div className={styles.spinner}>
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
        <div className={styles.spinnerBlade} />
      </div>
    </div>
  );
};
