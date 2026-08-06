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
        <BarChart data={data}>
          <CartesianGrid stroke="#d8d0c1" strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={{ fill: "#142033", fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `₹${Number(value) / 100000}L`} tick={{ fill: "#142033", fontSize: 12 }} />
          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Exposure"]} />
          <Legend />
          <Bar dataKey="Low" stackId="a" fill="#2f7d52" />
          <Bar dataKey="Medium" stackId="a" fill="#b87820" />
          <Bar dataKey="High" stackId="a" fill="#a13d32" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
