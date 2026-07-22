// Returns false during SSR / first paint, true after the component mounts.
// Use to gate client-only rendering and keep prerender/SSR safe.

import { useEffect, useState } from "react";

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
