import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export function ComboboxChips({
  options,
  selectedValues,
  onValueChange,
  placeholder = "Search...",
  disabled = false,
  className,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selectedValues ?? []), [selectedValues]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return options
      .filter((option) => !selectedSet.has(option.value))
      .filter((option) =>
        normalized.length === 0
          ? true
          : option.label.toLowerCase().includes(normalized),
      );
  }, [options, query, selectedSet]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddValue = (value) => {
    if (disabled) return;
    if (!selectedSet.has(value)) {
      onValueChange([...(selectedValues ?? []), value]);
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveValue = (value) => {
    if (disabled) return;
    onValueChange((selectedValues ?? []).filter((item) => item !== value));
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Backspace" && !query && selectedValues?.length) {
      handleRemoveValue(selectedValues[selectedValues.length - 1]);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "min-h-[56px] flex flex-wrap items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-60",
        )}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {(selectedValues ?? []).map((value) => {
          const option = options.find((item) => item.value === value);
          return option ? (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-input bg-muted px-2 py-1 text-sm text-foreground"
            >
              <span>{option.label}</span>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveValue(value);
                }}
                aria-label={`Remove ${option.label}`}
              >
                ×
              </button>
            </span>
          ) : null;
        })}

        <input
          ref={inputRef}
          type="text"
          className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
        />
      </div>

      {open && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-3xl border border-input bg-card shadow-2xl">
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAddValue(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-3xl border border-input bg-card p-3 text-sm text-muted-foreground shadow-2xl">
          ไม่มีตัวเลือกตรงกับคำค้นหา
        </div>
      )}
    </div>
  );
}
