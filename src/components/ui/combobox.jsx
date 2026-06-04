import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "../../lib/utils";

export function ComboboxChips({
  options,
  selectedValues,
  onValueChange,
  placeholder,
  disabled,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedValuesSet = useMemo(
    () => new Set(selectedValues ?? []),
    [selectedValues],
  );

  const handleSelect = (value) => {
    if (disabled) return;
    if (selectedValuesSet.has(value)) return;
    onValueChange([...(selectedValues ?? []), value]);
    setQuery("");
    setOpen(false);
  };

  const handleRemove = (value) => {
    if (disabled) return;
    onValueChange((selectedValues ?? []).filter((item) => item !== value));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          "min-h-[3rem] w-full overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-50",
        )}
      >
        <div className="flex flex-wrap gap-2">
          {(selectedValues ?? []).map((value) => {
            const option = options.find((item) => item.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-2 rounded-full border border-input bg-muted px-2 py-1 text-xs"
              >
                <span>{option?.label ?? value}</span>
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => handleRemove(value)}
                  disabled={disabled}
                  aria-label={`ลบ ${option?.label ?? value}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
          <div className="flex-1 min-w-[120px]">
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="h-10 w-full bg-transparent px-0 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
        <ChevronsUpDown className="h-4 w-4" />
      </div>

      {open && !disabled ? (
        <div className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md border border-input bg-popover text-foreground shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-accent/50",
                  selectedValuesSet.has(option.value) && "cursor-not-allowed text-muted-foreground",
                )}
                onClick={() => handleSelect(option.value)}
                disabled={selectedValuesSet.has(option.value)}
              >
                <span>{option.label}</span>
                {selectedValuesSet.has(option.value) ? (
                  <span className="text-xs text-muted-foreground">เลือกแล้ว</span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">ไม่พบตัวเลือก</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
