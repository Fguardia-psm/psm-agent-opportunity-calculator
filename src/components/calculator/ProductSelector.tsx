import { Check } from "lucide-react";
import { ALL_PRODUCTS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/calculator/assumptions";
import type { ProductId } from "@/lib/calculator/types";
import { cn } from "@/lib/utils";

interface ProductSelectorProps {
  selected: ProductId[];
  onChange: (next: ProductId[]) => void;
}

export function ProductSelector({ selected, onChange }: ProductSelectorProps) {
  const toggle = (id: ProductId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Select <span className="font-medium text-foreground">every product line you currently write</span>.
        Anything left unchecked is treated as opportunity — Year-1 impact and multi-year compounding on
        lines PSM can help you add.
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const products = ALL_PRODUCTS.filter((p) => p.category === cat);
        return (
          <div key={cat}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((product) => {
                const isOn = selected.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggle(product.id)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      isOn
                        ? "border-primary/40 bg-primary/[0.04]"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        isOn
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface",
                      )}
                    >
                      {isOn && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="text-sm font-medium text-foreground">{product.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
