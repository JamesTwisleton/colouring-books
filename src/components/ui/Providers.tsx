"use client";

import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient, setupQueryPersistence } from "@/lib/query/queryClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  const persistenceSetUp = useRef(false);

  useEffect(() => {
    if (persistenceSetUp.current) return;
    persistenceSetUp.current = true;
    setupQueryPersistence(client);
  }, [client]);

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
