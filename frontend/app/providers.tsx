"use client";

import { type Dispatch, type ReactNode, type SetStateAction, createContext } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { usePreference } from "@/hooks/use-user-preferences";
import { AISettingsProvider } from "@/context/ai-settings";

export const AppContext = createContext<{
  font: string;
  setFont: Dispatch<SetStateAction<string>>;
}>({
  font: "Default",
  setFont: () => {},
});

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  
  return (
    <Toaster 
      theme={theme}
      position="top-right"
      duration={4000}
      closeButton
      richColors
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
};

export default function Providers({ children }: { children: ReactNode }) {
  // Use database-backed preference instead of localStorage
  const [font, setFont] = usePreference<string>("novel__font", "Default");

  return (
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange defaultTheme="system">
      <AppContext.Provider
        value={{
          font,
          setFont,
        }}
      >
        <AISettingsProvider>
          <ToasterProvider />
          {children}
        </AISettingsProvider>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
