"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = {
  category: string;
  Low: number;
  Medium: number;
  High: number;
};

export function ExposureChart({ data }: { data: Row[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#111111" strokeDasharray="3 7" opacity={0.14} vertical={false} />
          <XAxis dataKey="category" tick={{ fill: "#111111", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => `INR ${Number(value) / 100000}L`} tick={{ fill: "#111111", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={72} />
          <Tooltip
            cursor={{ fill: "rgba(255,216,77,0.22)" }}
            contentStyle={{ border: "2px solid #111111", borderRadius: 18, boxShadow: "6px 6px 0 rgba(17,17,17,0.14)" }}
            formatter={(value) => [`INR ${Number(value).toLocaleString("en-IN")}`, "Exposure"]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: 800, paddingTop: 12 }} />
          <Bar dataKey="Low" stackId="a" fill="#43A047" radius={[0, 0, 10, 10]} animationDuration={850} />
          <Bar dataKey="Medium" stackId="a" fill="#FFD84D" animationDuration={950} />
          <Bar dataKey="High" stackId="a" fill="#E53935" radius={[10, 10, 0, 0]} animationDuration={1050} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
