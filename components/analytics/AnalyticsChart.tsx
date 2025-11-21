import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card } from '../ui/Card';

type ChartType = 'area' | 'bar';

type DataPoint = {
    name: string;
    value: number;
    [key: string]: string | number;
};

type AnalyticsChartProps = {
    title: string;
    description?: string;
    data: DataPoint[];
    type?: ChartType;
    color?: string;
    height?: number;
    className?: string;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div
                style={{
                    backgroundColor: 'var(--ms-color-surface)',
                    border: '1px solid var(--ms-color-border)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--ms-radius-md)',
                    boxShadow: 'var(--ms-shadow-md)',
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--ms-color-text-muted)',
                        fontWeight: 600,
                    }}
                >
                    {label}
                </p>
                <p
                    style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.875rem',
                        color: 'var(--ms-color-primary)',
                        fontWeight: 700,
                    }}
                >
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

export function AnalyticsChart({
    title,
    description,
    data,
    type = 'area',
    color = '#4f46e5', // Indigo 600
    height = 300,
    className = '',
}: AnalyticsChartProps) {
    return (
        <Card title={title} description={description} className={className}>
            <div style={{ width: '100%', height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'area' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ms-color-border)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--ms-color-text-muted)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--ms-color-text-muted)', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--ms-color-border-strong)', strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#color-${title})`}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ms-color-border)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--ms-color-text-muted)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--ms-color-text-muted)', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--ms-color-surface-subtle)' }} />
                            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
