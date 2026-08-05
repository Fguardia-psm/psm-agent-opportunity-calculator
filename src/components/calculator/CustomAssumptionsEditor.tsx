import { useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  CATEGORY_LABELS,
  FIRST_YEAR_REVENUE,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CustomAssumptionsEditorProps {
  value: CustomAssumptions;
  onChange: (next: CustomAssumptions) => void;
}

export function CustomAssumptionsEditor({ value, onChange }: CustomAssumptionsEditorProps) {
  const [open, setOpen] = useState(value.useCustom);

  const setField = <K extends keyof CustomAssumptions>(key: K, v: CustomAssumptions[K]) => {
    onChange({ ...value, useCustom: true, [key]: v });
  };

  const setProduct = (
    id: OpportunityProductId,
    field: "firstYearRevenue" | "renewalRevenue",
    raw: string,
  ) => {
    const n = raw.trim() === "" ? undefined : Number(raw.replace(/[,\s]/g, ""));
    const prev = value.productOverrides[id] ?? {};
    const nextOverride = {
      ...prev,
      [field]: n != null && Number.isFinite(n) && n >= 0 ? n : undefined,
    };
    onChange({
      ...value,
      useCustom: true,
      productOverrides: { ...value.productOverrides, [id]: nextOverride },
    });
  };

  const reset = () => {
    onChange(defaultCustomAssumptions());
    setOpen(false);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !value.useCustom) {
          onChange({ ...value, useCustom: true });
        }
      }}
    >
      <div className="rounded-2xl border border-border bg-surface shadow-card print:hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
          >
            <span className="flex items-center gap-2.5">
              <SlidersHorizontal className="size-4 shrink-0 text-accent" />
              <span>
                <span className="block font-medium text-foreground">
                  Use my contract assumptions
                </span>
                <span className="block text-xs text-muted-foreground">
                  Override place rate, persistency, and per-line first-year / renewal commission
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
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-5 border-t border-border px-5 py-5">
            <p className="text-sm text-muted-foreground">
              Defaults: MA uses CMS national FMV structure; other lines are mid-market illustrations.
              Enter <span className="font-medium text-foreground">your</span> contract levels for a
              tighter personal model.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="attach-mod">Planning place rate on eligible clients (%)</Label>
                <Input
                  id="attach-mod"
                  type="number"
                  min={1}
                  max={40}
                  step={1}
                  value={value.attachModeratePercent}
                  onChange={(e) =>
                    setField("attachModeratePercent", Number(e.target.value) || 10)
                  }
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pers-mod">Planning persistency (%)</Label>
                <Input
                  id="pers-mod"
                  type="number"
                  min={50}
                  max={98}
                  step={1}
                  value={value.persistencyModeratePercent}
                  onChange={(e) =>
                    setField("persistencyModeratePercent", Number(e.target.value) || 85)
                  }
                  className="tabular-nums"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Per-line commission (optional)
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Cat.</th>
                      <th className="px-3 py-2 font-medium">1st-year $</th>
                      <th className="px-3 py-2 font-medium">Renewal $</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPPORTUNITY_PRODUCT_IDS.map((id) => {
                      const o = value.productOverrides[id];
                      return (
                        <tr key={id} className="border-b border-border/70 last:border-0">
                          <td className="px-3 py-2 text-foreground">{PRODUCT_LABELS[id]}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {CATEGORY_LABELS[PRODUCT_BY_ID[id].category]}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              placeholder={String(FIRST_YEAR_REVENUE[id])}
                              value={o?.firstYearRevenue ?? ""}
                              onChange={(e) => setProduct(id, "firstYearRevenue", e.target.value)}
                              className="h-9 tabular-nums"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              placeholder={String(RENEWAL_REVENUE[id])}
                              value={o?.renewalRevenue ?? ""}
                              onChange={(e) => setProduct(id, "renewalRevenue", e.target.value)}
                              className="h-9 tabular-nums"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="size-3.5" />
                Reset to defaults
              </Button>
              {value.useCustom && (
                <span className="self-center text-xs font-medium text-accent">
                  Custom assumptions active — results update live
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
