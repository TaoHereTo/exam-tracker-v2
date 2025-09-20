import React from 'react';
import styles from './UiverseSpinner.module.css';

interface UiverseSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number | string;
  className?: string;
  centered?: boolean;
}

const sizeMap = {
  sm: '16px',
  md: '28px',
  lg: '40px'
};

export const UiverseSpinner: React.FC<UiverseSpinnerProps> = ({ size = 'md', className = '', centered = false }) => {
  // Handle custom size values
  const fontSize = typeof size === 'number' ? `${size}px` : 
                  size in sizeMap ? sizeMap[size as keyof typeof sizeMap] : 
                  size;

  return (
    <div 
      className={`${className} ${centered ? styles.center : ''}`} 
      style={{ 
        fontSize: fontSize,
        position: centered ? 'absolute' : 'relative',
        display: 'flex',
        alignItems: 'center',
        verticalAlign: 'middle'
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
export const SimpleUiverseSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' | number | string; className?: string }> = ({ size = 'md', className = '' }) => {
  // Handle custom size values
  const fontSize = typeof size === 'number' ? `${size}px` : 
                  size in sizeMap ? sizeMap[size as keyof typeof sizeMap] : 
                  size;

  return (
    <div 
      className={className} 
      style={{ 
        fontSize: fontSize,
        display: 'flex',
        alignItems: 'center',
        verticalAlign: 'middle'
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