import React, { useMemo } from 'react';
import { JobApplicationData, ApplicationStatus, APPLICATION_STATUSES } from '../../types';

interface StatusOverviewProps {
  applications: JobApplicationData[];
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'To Apply': 'bg-gray-400',
  'Applied': 'bg-blue-500',
  'Interviewing': 'bg-yellow-500',
  'Offered': 'bg-green-500',
  'Rejected': 'bg-red-500',
};

const STATUS_STROKE_COLORS: Record<ApplicationStatus, string> = {
  'To Apply': 'stroke-gray-400',
  'Applied': 'stroke-blue-500',
  'Interviewing': 'stroke-yellow-500',
  'Offered': 'stroke-green-500',
  'Rejected': 'stroke-red-500',
};

const DonutChart: React.FC<{ data: { name: ApplicationStatus, value: number }[] }> = ({ data }) => {
    const size = 150;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let cumulativeOffset = 0;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                {data.map(item => {
                    if (item.value === 0) return null;
                    const dashoffset = circumference - (item.value / total) * circumference;
                    const strokeDasharray = `${circumference - dashoffset} ${dashoffset}`;
                    const rotation = (cumulativeOffset / total) * 360;
                    cumulativeOffset += item.value;

                    return (
                         <circle
                            key={item.name}
                            className={`${STATUS_STROKE_COLORS[item.name]} transition-all duration-500 ease-out`}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            r={radius}
                            cx={size / 2}
                            cy={size / 2}
                            strokeDasharray={strokeDasharray}
                            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
                            strokeLinecap="butt"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{total}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
            </div>
        </div>
    );
};


const StatusOverview: React.FC<StatusOverviewProps> = ({ applications }) => {

  const statusCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      'To Apply': 0,
      'Applied': 0,
      'Interviewing': 0,
      'Offered': 0,
      'Rejected': 0,
    };
    applications.forEach(app => {
      if (counts[app.applicationStatus] !== undefined) {
        counts[app.applicationStatus]++;
      }
    });
    return APPLICATION_STATUSES.map(status => ({ name: status, value: counts[status] }));
  }, [applications]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Status Overview</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
            <DonutChart data={statusCounts} />
            <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full">
                {statusCounts.map(item => (
                    <div key={item.name} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">{item.value}</p>
                        <div className={`h-1.5 w-12 mx-auto mt-2 rounded-full ${STATUS_COLORS[item.name]}`}></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default StatusOverview;
