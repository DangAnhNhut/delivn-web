"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  searchAdministrativeOptions,
  type AdministrativeOption,
} from "@/data/vietnam-administrative-units";

export type AdministrativeComboboxProps = {
  id: string;
  label: string;
  value: string;
  options: readonly AdministrativeOption[];
  onValueChange: (code: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
};

export function AdministrativeCombobox({
  id,
  label,
  value,
  options,
  onValueChange,
  disabled = false,
  required = false,
  placeholder,
  error,
}: AdministrativeComboboxProps) {
  const selectedOption = options.find((option) => option.code === value);
  const [query, setQuery] = useState(selectedOption?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suppressExternalClearRef = useRef(false);
  const listboxId = `${id}-listbox`;
  const filteredOptions = useMemo(
    () => searchAdministrativeOptions(options, query),
    [options, query],
  );

  useEffect(() => {
    if (suppressExternalClearRef.current && value === "") {
      suppressExternalClearRef.current = false;
      return;
    }
    setQuery(selectedOption?.name ?? "");
  }, [selectedOption?.name, value]);

  const commitOption = (option: AdministrativeOption) => {
    suppressExternalClearRef.current = false;
    setQuery(option.name);
    setActiveIndex(-1);
    setIsOpen(false);
    onValueChange(option.code);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setActiveIndex(-1);
    setIsOpen(true);
    if (value) {
      suppressExternalClearRef.current = true;
      onValueChange("");
    }
  };

  const moveActive = (nextIndex: number) => {
    if (filteredOptions.length === 0) return;
    setIsOpen(true);
    setActiveIndex(Math.max(0, Math.min(nextIndex, filteredOptions.length - 1)));
  };

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && !disabled}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        required={required}
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) setIsOpen(true);
        }}
        onChange={(event) => handleQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(activeIndex < 0 ? 0 : activeIndex + 1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(activeIndex < 0 ? filteredOptions.length - 1 : activeIndex - 1);
          } else if (event.key === "Home") {
            event.preventDefault();
            moveActive(0);
          } else if (event.key === "End") {
            event.preventDefault();
            moveActive(filteredOptions.length - 1);
          } else if (event.key === "Enter" && isOpen) {
            event.preventDefault();
            const activeOption = filteredOptions[activeIndex];
            if (activeOption) commitOption(activeOption);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setActiveIndex(-1);
            setIsOpen(false);
          }
        }}
        className="mt-2 min-h-12 w-full border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted/60 focus:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
      />

      {isOpen && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full max-w-full overflow-x-hidden overflow-y-auto border border-foreground bg-background shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                id={`${id}-option-${index}`}
                key={option.code}
                role="option"
                aria-selected={value === option.code}
                onPointerDown={(event) => {
                  event.preventDefault();
                  commitOption(option);
                }}
                className={`flex min-h-12 cursor-pointer items-center px-4 py-3 text-sm text-foreground transition-colors motion-reduce:transition-none ${
                  activeIndex === index
                    ? "bg-foreground text-background"
                    : "bg-background hover:bg-cream"
                }`}
              >
                {option.name}
              </li>
            ))
          ) : (
            <li role="status" className="px-4 py-4 text-xs font-semibold tracking-[0.08em] text-foreground-muted uppercase">
              KHÔNG TÌM THẤY LỰA CHỌN
            </li>
          )}
        </ul>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
