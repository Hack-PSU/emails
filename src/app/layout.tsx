import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { LayoutProvider } from "@/common/context";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material";
import theme from "@/theme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["700"], // This ensures we load the Bold weight
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HackPSU Email Forward Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LayoutProvider>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </AppRouterCacheProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}
