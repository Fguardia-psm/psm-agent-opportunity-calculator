import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BookPathChartProps {
  result: CalculationResult;
}

export function BookPathChart({ result }: BookPathChartProps) {
  const { moderatePathByYear, hasFullPortfolio, horizonYears } = result;

  if (hasFullPortfolio || moderatePathByYear.length === 0) return null;

  const data = moderatePathByYear.map((y) => ({
    name: `Year ${y.year}`,
    "First-year production": Math.round(y.firstYearProduction),
    "Renewals (compounding)": Math.round(y.renewalProduction),
  }));

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Compounding path — Year 1 through {horizonYears}
        </CardTitle>
        <CardDescription>
          Planning scenario on lines you do not offer. Year 1 is mostly first-year commission
          (existing-book attach + new lives). Later years stack renewals on retained in-force while
          new production continues — that residual growth is the compounding effect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 1,
                  }).format(Number(v))
                }
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value: number | string) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="First-year production" stackId="a" fill="var(--color-primary)" />
              <Bar
                dataKey="Renewals (compounding)"
                stackId="a"
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {moderatePathByYear.map((y) => (
            <li
              key={y.year}
              className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs"
            >
              <p className="font-medium text-foreground">Year {y.year}</p>
              <p className="mt-1 tabular-nums text-muted-foreground">
                New: {formatCurrency(y.firstYearProduction)}
              </p>
              <p className="tabular-nums text-muted-foreground">
                Renewals: {formatCurrency(y.renewalProduction)}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-foreground">
                Total: {formatCurrency(y.total)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
