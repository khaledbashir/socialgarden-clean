"use client";

import { Check, Monitor, Moon, SunDim, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { useEffect, useState } from "react";

// TODO implement multiple fonts editor
// const fonts = [
//   {
//     font: "Default",
//     icon: <FontDefault className="h-4 w-4" />,
//   },
//   {
//     font: "Serif",
//     icon: <FontSerif className="h-4 w-4" />,
//   },
//   {
//     font: "Mono",
//     icon: <FontMono className="h-4 w-4" />,
//   },
// ];
const appearances = [
  {
    theme: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    theme: "Light",
    icon: <SunDim className="h-4 w-4" />,
  },
  {
    theme: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
];
interface MenuProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export default function Menu({ onExportPDF, onExportExcel }: MenuProps) {
  // const { font: currentFont, setFont } = useContext(AppContext);
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentIcon = appearances.find(a => a.theme.toLowerCase() === currentTheme)?.icon || <Monitor className="h-4 w-4" />;

  return (
    <div className="flex items-center gap-2">
      {onExportPDF && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          className="sg-button"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      )}
      {/* Excel Export - HIDDEN for now (kept for future use) */}
      {onExportExcel && false && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          className="sg-button"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          GSheet
        </Button>
      )}
      <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          {mounted ? currentIcon : <Monitor className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        {/* <div className="p-2">
          <p className="p-2 text-xs font-medium text-stone-500">Font</p>
          {fonts.map(({ font, icon }) => (
            <button
              key={font}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
              onClick={() => {
                setFont(font);
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="rounded-sm border border-stone-200 p-1">
                  {icon}
                </div>
                <span>{font}</span>
              </div>
              {currentFont === font && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div> */}
        <p className="p-2 text-xs font-medium text-muted-foreground">Appearance</p>
        {appearances.map(({ theme, icon }) => (
          <Button
            variant="ghost"
            key={theme}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
            onClick={() => {
              setTheme(theme.toLowerCase());
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border  p-1">{icon}</div>
              <span>{theme}</span>
            </div>
            {currentTheme === theme.toLowerCase() && <Check className="h-4 w-4" />}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
    </div>
  );
}
