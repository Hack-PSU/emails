"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthGuard from "./AuthGuard";
import FirebaseProvider from "./FirebaseProvider";
import { auth } from "@/common/config";

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
      <FirebaseProvider auth={auth}>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>{children}</AuthGuard>
        </QueryClientProvider>
      </FirebaseProvider>
    </>
  );
}
