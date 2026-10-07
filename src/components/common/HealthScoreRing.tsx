import React from 'react';
import { getConditionStatus } from '../../services/healthCalculator';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showBreakdownLabel?: boolean;
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = ({
  score,
  size = 110,
  strokeWidth = 9,
  showBreakdownLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const condition = getConditionStatus(clampedScore);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#10b981'; // emerald
  let textColor = 'text-emerald-700';

  if (clampedScore < 40) {
    strokeColor = '#ef4444'; // rose/red
    textColor = 'text-rose-700';
  } else if (clampedScore < 60) {
    strokeColor = '#f97316'; // orange
    textColor = 'text-orange-700';
  } else if (clampedScore < 80) {
    strokeColor = '#f59e0b'; // amber
    textColor = 'text-amber-700';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-2xl font-black tracking-tight ${textColor} font-mono leading-none`}>
            {clampedScore}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showBreakdownLabel && (
        <div className="mt-2 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Health: {condition}
          </span>
          <span className="text-[11px] text-slate-500">
            {condition === 'GOOD' && 'Normal operational status'}
            {condition === 'WARNING' && 'Maintenance needed soon'}
            {condition === 'POOR' && 'Surface repairs required'}
            {condition === 'CRITICAL' && 'Immediate intervention required'}
          </span>
        </div>
      )}
    </div>
  );
};
