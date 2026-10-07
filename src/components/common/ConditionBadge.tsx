import React from 'react';
import { ConditionStatus } from '../../types';

interface ConditionBadgeProps {
  condition: ConditionStatus;
  size?: 'sm' | 'md' | 'lg';
  showHealthScore?: number;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  condition,
  size = 'md',
  showHealthScore,
}) => {
  const configs: Record<
    ConditionStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    GOOD: {
      label: 'GOOD',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    WARNING: {
      label: 'WARNING',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-600',
    },
    POOR: {
      label: 'POOR',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-300',
      dot: 'bg-orange-600',
    },
    CRITICAL: {
      label: 'CRITICAL',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      dot: 'bg-rose-600',
    },
  };

  const cfg = configs[condition] || configs.GOOD;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-bold tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot} inline-block`} />
      <span>{cfg.label}</span>
      {typeof showHealthScore === 'number' && (
        <span className="ml-1 opacity-85 font-mono">({showHealthScore}/100)</span>
      )}
    </span>
  );
};
