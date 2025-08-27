"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const MODELS = [
  { value: "sonar-pro", label: "Sonar Pro" },
  { value: "sonar-mini", label: "Sonar Mini" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SettingsMenu({ value, onChange }: Props) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Settings"
          className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className="z-50 min-w-[10rem] rounded-md border border-black/10 bg-white p-1 shadow-md dark:border-white/20 dark:bg-gray-900"
      >
        <div className="px-2 py-1.5 text-xs font-medium text-black/50 dark:text-white/50">
          Model
        </div>
        {MODELS.map((m) => (
          <DropdownMenu.Item
            key={m.value}
            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-black/5 dark:focus:bg-white/10"
            onSelect={() => onChange(m.value)}
          >
            {m.label}
            {value === m.value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenu.Item>
        ))}
        
        <DropdownMenu.Separator className="my-1 h-px bg-black/10 dark:bg-white/10" />
        
        <div className="px-2 py-1.5 text-xs font-medium text-black/50 dark:text-white/50">
          Appearance
        </div>
        <DropdownMenu.Item
          className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-black/5 dark:focus:bg-white/10"
          onSelect={toggleTheme}
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </>
          )}
          <div className="ml-auto">
            <div
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

