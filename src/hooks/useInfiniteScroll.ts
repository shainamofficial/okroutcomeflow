import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a sentinel element at the end of a list.
 * When the sentinel scrolls near the viewport, onLoadMore fires.
 * The rootMargin preloads before the user actually reaches the end.
 */
export function useInfiniteScroll(onLoadMore: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
