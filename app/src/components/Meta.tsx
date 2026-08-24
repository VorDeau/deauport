import { useEffect } from "react";

export default function Meta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.documentElement.lang = "en";
    for (const tag of document.head.querySelectorAll('meta[name="description"][data-emitted]')) {
      tag.remove();
    }
  }, []);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
}
