import { useEffect, useState } from "react";

export function useNearViewport(
  rootMargin = "800px",
): [boolean, (node: HTMLElement | null) => void] {
  const [near, setNear] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (near || !node) return;
    if (typeof IntersectionObserver !== "function") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin, near]);

  return [near, setNode];
}
