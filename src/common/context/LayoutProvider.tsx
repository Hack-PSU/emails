"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGuard, Role } from "./AuthGuard";
import { FirebaseProvider } from "./FirebaseProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FirebaseProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard config={{ minimumRole: Role.TEAM, authServerUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL }}>{children}</AuthGuard>
        </QueryClientProvider>
      </FirebaseProvider>
    </>
  );
}
