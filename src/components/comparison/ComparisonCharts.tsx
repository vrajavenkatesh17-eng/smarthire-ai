import { useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface CandidateScore {
  id: string;
  name: string;
  scores: Record<string, number>;
  overallScore: number | null;
  color: string;
}

interface ComparisonChartsProps {
  candidates: CandidateScore[];
}

const COLORS = [
  "hsl(262, 83%, 58%)", // Primary purple
  "hsl(142, 71%, 45%)", // Green
  "hsl(38, 92%, 50%)",  // Orange
  "hsl(199, 89%, 48%)", // Blue
];

export const ComparisonCharts = ({ candidates }: ComparisonChartsProps) => {
  // Prepare data for radar chart
  const radarData = useMemo(() => {
    const categories = new Set<string>();
    candidates.forEach(c => {
      Object.keys(c.scores).forEach(key => {
        if (key !== "Overall") categories.add(key);
      });
    });

    return Array.from(categories).map(category => {
      const dataPoint: Record<string, any> = { category };
      candidates.forEach(c => {
        dataPoint[c.name] = c.scores[category] || 0;
      });
      return dataPoint;
    });
  }, [candidates]);

  // Prepare data for bar chart
  const barData = useMemo(() => {
    return candidates.map((c, index) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
      fullName: c.name,
      score: c.overallScore || 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [candidates]);

  if (candidates.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Radar Chart - Skills Comparison */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Skills Comparison
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              {candidates.map((candidate, index) => (
                <Radar
                  key={candidate.id}
                  name={candidate.name}
                  dataKey={candidate.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-foreground">{value}</span>
                )}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Overall Scores */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Overall Scores
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}%`,
                  props.payload.fullName,
                ]}
                labelFormatter={() => "Score"}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ComparisonCharts;
