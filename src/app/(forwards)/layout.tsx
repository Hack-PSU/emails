import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { LayoutProvider } from "@/common/context";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material";
import theme from "@/theme";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { AuthGuard, Role } from "@/common/context/AuthGuard";

export default function ExtraProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthGuard config={{ minimumRole: Role.EXEC }}>{children}</AuthGuard>;
}
