import { useState, useCallback, useRef } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';

interface ScrollFadesReturn {
  showTopFade: boolean;
  showBottomFade: boolean;
  scrollHandler: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onContentSizeChange: (w: number, h: number) => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

/**
 * Tracks scroll position and content overflow to drive top/bottom fade visibility.
 *
 * - Top fade appears once the user scrolls down (offset > threshold)
 * - Bottom fade appears when more content exists below the visible area
 * - Both use a small threshold (10px) to avoid flickering at edges
 */
export function useScrollFades(threshold = 10): ScrollFadesReturn {
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const contentH = useRef(0);
  const viewH = useRef(0);

  const updateFromScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      setShowTopFade(contentOffset.y > threshold);
      const distFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      setShowBottomFade(distFromBottom > threshold);
    },
    [threshold]
  );

  const updateOverflow = useCallback(() => {
    // Initial check before any scrolling — does content overflow?
    setShowBottomFade(contentH.current > viewH.current + threshold);
  }, [threshold]);

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentH.current = h;
      updateOverflow();
    },
    [updateOverflow]
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      viewH.current = e.nativeEvent.layout.height;
      updateOverflow();
    },
    [updateOverflow]
  );

  return {
    showTopFade,
    showBottomFade,
    scrollHandler: updateFromScroll,
    onContentSizeChange,
    onLayout,
  };
}
