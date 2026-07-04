import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "../styles.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Welcome back — Sign in",
  description:
    "A delightful, character-driven login experience with playful animated characters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster 
          position="top-center" 
          toastOptions={{
            classNames: {
              success: 'bg-green-100 text-green-900 border-green-200',
              error: 'bg-red-100 text-red-900 border-red-200',
              toast: 'rounded-xl shadow-lg font-medium border px-4 py-3',
            },
          }} 
        />
      </body>
    </html>
  );
}
