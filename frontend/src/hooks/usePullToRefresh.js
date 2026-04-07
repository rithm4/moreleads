import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh) {
  const startY = useRef(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const THRESHOLD = 70;

    const onTouchStart = e => {
      if (window.scrollY === 0) startY.current = e.touches[0].clientY;
    };

    const onTouchMove = e => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 20 && window.scrollY === 0) setPulling(true);
    };

    const onTouchEnd = async e => {
      if (startY.current === null) return;
      const delta = (e.changedTouches[0]?.clientY || 0) - startY.current;
      startY.current = null;
      setPulling(false);
      if (delta > THRESHOLD && window.scrollY === 0) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return { pulling, refreshing };
}
