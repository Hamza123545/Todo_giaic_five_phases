export interface ChartDataPoint {
  name: string; // Week name, date, etc.
  value: number; // Primary value
  secondary?: number; // Secondary value (for dual charts)
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Example data for bar chart:
export const mockBarChartData: ChartDataPoint[] = [
  { name: 'W1', value: 4000, secondary: 2400 },
  { name: 'W2', value: 3000, secondary: 1398 },
  { name: 'W3', value: 2000, secondary: 9800 },
  { name: 'W4', value: 2780, secondary: 3908 },
  { name: 'W5', value: 1890, secondary: 4800 },
  { name: 'W6', value: 2390, secondary: 3800 },
];

// Example data for line chart:
export const mockLineChartData: ChartDataPoint[] = [
  { name: 'W1', value: 4000 },
  { name: 'W2', value: 3000 },
  { name: 'W3', value: 2000 },
  { name: 'W4', value: 2780 },
  { name: 'W5', value: 1890 },
  { name: 'W6', value: 2390 },
];

