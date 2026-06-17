import { useEffect, useRef } from 'react';

/**
 * Détecte un swipe depuis le bord gauche de l'écran (< 30px)
 * vers la droite (> 80px) pour ouvrir le sidebar mobile.
 */
export default function useSwipeGesture({ onSwipeRight, threshold = 80, edgeWidth = 35 }) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      // Only activate if touch starts from the left edge
      if (touch.clientX <= edgeWidth) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
      } else {
        touchStartX.current = null;
        touchStartY.current = null;
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Swipe right > threshold AND mostly horizontal (not a scroll)
      if (deltaX > threshold && deltaY < 80) {
        onSwipeRight?.();
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeRight, threshold, edgeWidth]);
}
