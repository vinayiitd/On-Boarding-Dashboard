"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
  type QueryClientConfig,
} from "@tanstack/react-query";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Small window to avoid re-fetching on tab focus in the demo tier.
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
};

function makeQueryClient(): QueryClient {
  return new QueryClient(config);
}

let browserClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (isServer) {
    // Fresh client per request on the server.
    return makeQueryClient();
  }
  // Shared singleton on the client. Guarded so React Strict Mode's double
  // render in dev doesn't drop the cache.
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(getQueryClient, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
