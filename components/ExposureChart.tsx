"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = {
  category: string;
  Low: number;
  Medium: number;
  High: number;
};

function formatCurrencyAbbrev(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}k`;
  }
  return `₹${value}`;
}

export function ExposureChart({ data }: { data: Row[] }) {
  return (
    <div className="h-72 w-full sm:h-80 md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#111111" strokeDasharray="3 7" opacity={0.14} vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fill: "#111111", fontSize: 12, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatCurrencyAbbrev(Number(value))}
            tick={{ fill: "#111111", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,216,77,0.22)" }}
            contentStyle={{
              border: "2px solid #111111",
              borderRadius: 18,
              boxShadow: "6px 6px 0 rgba(17,17,17,0.14)",
              backgroundColor: "#FFFFFF"
            }}
            formatter={(value: number | string, name: string) => [
              `INR ${Number(value).toLocaleString("en-IN")}`,
              `${name} Risk`
            ]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: 800, paddingTop: 12 }} />
          <Bar dataKey="Low" name="Low" stackId="a" fill="#43A047" radius={[0, 0, 8, 8]} animationDuration={850} />
          <Bar dataKey="Medium" name="Medium" stackId="a" fill="#FFD84D" animationDuration={950} />
          <Bar dataKey="High" name="High" stackId="a" fill="#E53935" radius={[8, 8, 0, 0]} animationDuration={1050} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
