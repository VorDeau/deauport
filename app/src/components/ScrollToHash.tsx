import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!hash) {
      if (lastPath.current !== pathname) {
        lastPath.current = pathname;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }
      return;
    }

    lastPath.current = pathname;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [pathname, hash, key]);

  return null;
}
