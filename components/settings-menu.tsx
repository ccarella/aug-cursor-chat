"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Settings } from "lucide-react";

const MODELS = [{ value: "sonar", label: "Sonar" }];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SettingsMenu({ value, onChange }: Props) {
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
        className="z-50 min-w-[8rem] rounded-md border border-black/10 bg-white p-1 shadow-md dark:border-white/20 dark:bg-gray-900"
      >
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
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

