
import { useState, useEffect } from 'react';

export const useAnimation = () => {
  // Initialize with value from localStorage or default to false
  const [isAnimationEnabled, setIsAnimationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vitacheck_animation_enabled');
      return saved === 'true';
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return false;
    }
  });

  // Update localStorage when the value changes
  useEffect(() => {
    try {
      localStorage.setItem('vitacheck_animation_enabled', isAnimationEnabled.toString());
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }, [isAnimationEnabled]);

  const toggleAnimation = () => {
    setIsAnimationEnabled(prev => !prev);
  };

  return {
    isAnimationEnabled,
    toggleAnimation
  };
};
