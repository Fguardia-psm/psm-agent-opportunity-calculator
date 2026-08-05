import { useEffect, useId, useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  CATEGORY_LABELS,
  FIRST_YEAR_REVENUE,
  MIN_PERSISTENCY,
  OPPORTUNITY_PRODUCT_IDS,
  PRODUCT_BY_ID,
  PRODUCT_LABELS,
  RENEWAL_REVENUE,
} from "@/lib/calculator/assumptions";
import { defaultCustomAssumptions } from "@/lib/calculator/defaults";
import type { CustomAssumptions, OpportunityProductId } from "@/lib/calculator/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomAssumptionsEditorProps {
  value: CustomAssumptions;
  onChange: (next: CustomAssumptions) => void;
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Money field that does not snap while the agent is typing */
function MoneyInput({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
      onBlur={() => {
        setFocused(false);
        const n = Number(draft);
        if (draft.trim() === "" || !Number.isFinite(n) || n < 0) {
          setDraft(String(value));
          return;
        }
        const rounded = Math.round(n * 100) / 100;
        setDraft(String(rounded));
        onCommit(rounded);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={className}
    />
  );
}

export function CustomAssumptionsEditor({ value, onChange }: CustomAssumptionsEditorProps) {
  const minPersPct = Math.round(MIN_PERSISTENCY * 100);
  const baseId = useId();
  const attachId = `${baseId}-attach`;
  const persId = `${baseId}-pers`;

  const [open, setOpen] = useState(() => value.useCustom);

  const [attachDraft, setAttachDraft] = useState(String(value.attachModeratePercent));
  const [persDraft, setPersDraft] = useState(String(value.persistencyModeratePercent));
  const [attachFocused, setAttachFocused] = useState(false);
  const [persFocused, setPersFocused] = useState(false);

  useEffect(() => {
    if (!attachFocused) setAttachDraft(String(value.attachModeratePercent));
  }, [value.attachModeratePercent, attachFocused]);

  useEffect(() => {
    if (!persFocused) setPersDraft(String(value.persistencyModeratePercent));
  }, [value.persistencyModeratePercent, persFocused]);

  const commitAttach = (raw: string) => {
    const n = clampInt(Number(raw.replace(/[^\d]/g, "")), 1, 40);
    setAttachDraft(String(n));
    onChange({ ...value, useCustom: true, attachModeratePercent: n });
  };

  const commitPers = (raw: string) => {
    const n = clampInt(Number(raw.replace(/[^\d]/g, "")), minPersPct, 98);
    setPersDraft(String(n));
    onChange({ ...value, useCustom: true, persistencyModeratePercent: n });
  };

  const setProductMoney = (
    id: OpportunityProductId,
    field: "firstYearRevenue" | "renewalRevenue",
    n: number,
  ) => {
    const prev = value.productOverrides[id] ?? {};
    onChange({
      ...value,
      useCustom: true,
      productOverrides: {
        ...value.productOverrides,
        [id]: { ...prev, [field]: n },
      },
    });
  };

  const reset = () => {
    const defaults = defaultCustomAssumptions();
    setAttachDraft(String(defaults.attachModeratePercent));
    setPersDraft(String(defaults.persistencyModeratePercent));
    onChange(defaults);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card print:break-inside-avoid">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${baseId}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <SlidersHorizontal className="size-4 shrink-0 text-accent" />
          <span className="min-w-0">
            <span className="font-medium text-foreground">Use my contract assumptions</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Optional. Override place rate, persistency (min {minPersPct}%), and per-line commission.
              {value.useCustom ? " Custom rates are active." : ""}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={`${baseId}-panel`}
          className="space-y-5 border-t border-border px-5 py-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={attachId}>Planning place rate (%)</Label>
              <Input
                id={attachId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={attachDraft}
                onFocus={() => setAttachFocused(true)}
                onChange={(e) => setAttachDraft(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => {
                  setAttachFocused(false);
                  commitAttach(attachDraft === "" ? "10" : attachDraft);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-11 tabular-nums"
              />
              <p className="text-[11px] text-muted-foreground">
                Share of eligible clients you place each year (planning scenario). Typical range 5–15.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={persId}>Planning persistency (%) — min {minPersPct}%</Label>
              <Input
                id={persId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={persDraft}
                onFocus={() => setPersFocused(true)}
                onChange={(e) => setPersDraft(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => {
                  setPersFocused(false);
                  commitPers(persDraft === "" ? "90" : persDraft);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-11 tabular-nums"
              />
              <p className="text-[11px] text-muted-foreground">
                Share of in-force kept each year. Face-to-face field default about 90%. Floor{" "}
                {minPersPct}%.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Per-line commission (optional)
            </p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              First-year and renewal dollars per placed case. Leave defaults if you are not sure.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium text-right">First-year $</th>
                    <th className="px-3 py-2 font-medium text-right">Renewal $</th>
                  </tr>
                </thead>
                <tbody>
                  {OPPORTUNITY_PRODUCT_IDS.map((id) => {
                    const def = PRODUCT_BY_ID[id];
                    const o = value.productOverrides[id];
                    const fy = o?.firstYearRevenue ?? FIRST_YEAR_REVENUE[id];
                    const ren = o?.renewalRevenue ?? RENEWAL_REVENUE[id];
                    return (
                      <tr key={id} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {PRODUCT_LABELS[id]}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {CATEGORY_LABELS[def.category]}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <MoneyInput
                            value={fy}
                            onCommit={(n) => setProductMoney(id, "firstYearRevenue", n)}
                            className="ml-auto h-9 w-28 tabular-nums text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <MoneyInput
                            value={ren}
                            onCommit={(n) => setProductMoney(id, "renewalRevenue", n)}
                            className="ml-auto h-9 w-28 tabular-nums text-right"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reset();
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset to defaults
            </Button>
            {value.useCustom && (
              <p className="text-xs font-medium text-accent">Custom rates applied to results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
