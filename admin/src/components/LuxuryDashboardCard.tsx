
import React from 'react';
import { Card, Statistic, Progress } from 'antd';
import { ReactNode } from 'react';

interface LuxuryDashboardCardProps {
  title: string;
  value: string | number;
  prefix?: ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  color?: string;
  loading?: boolean;
}

const LuxuryDashboardCard: React.FC<LuxuryDashboardCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  progress,
  color = 'var(--primary)',
  loading = false
}) => {
  return (
    <Card 
      className="stats-card hover:transform hover:-translate-y-1 transition-all duration-300"
      loading={loading}
    >
      <div className="relative">
        <Statistic
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title}</span>}
          value={value}
          precision={typeof value === 'number' ? 0 : undefined}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{ 
            color: color,
            fontSize: '1.75rem',
            fontWeight: 'bold'
          }}
        />
        
        {trend && (
          <div className="absolute top-2 right-2">
            <div className={`text-xs px-2 py-1 rounded-full ${
              trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </div>
          </div>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress 
              percent={progress} 
              showInfo={false} 
              strokeColor={color}
              trailColor="rgba(255, 255, 255, 0.1)"
              size="small"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default LuxuryDashboardCard;
