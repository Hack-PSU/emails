import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { HackPSUProvider, Role } from "@hackpsu/react-sdk";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material";
import theme from "@/theme";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";

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
        <HackPSUProvider
          config={{
            firebase: {
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
              databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
              messagingSenderId:
                process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
              appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
            },
            apiBaseUrl: process.env.NEXT_PUBLIC_BASE_URL_V3!,
            authServiceUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
            minimumRole: Role.TEAM,
          }}
        >
          <AppRouterCacheProvider>
            <Toaster richColors />
            <Navbar />
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </AppRouterCacheProvider>
        </HackPSUProvider>
      </body>
    </html>
  );
}
