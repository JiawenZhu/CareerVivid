import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { JobApplicationData, ApplicationStatus, APPLICATION_STATUSES } from '../../types';
import { AlertCircle, Briefcase, CheckCircle2, Clock3, Send, Trophy, XCircle } from 'lucide-react';

interface StatusOverviewProps {
  applications: JobApplicationData[];
  variant?: 'full' | 'compact';
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
  const { t } = useTranslation();
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
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('job_tracker.total')}</span>
      </div>
    </div>
  );
};


const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <div className="min-h-[92px] rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:min-h-[104px] sm:px-5 sm:py-4">
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:text-sm sm:normal-case sm:tracking-normal">{label}</span>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9 ${accent}`}>{icon}</span>
    </div>
    <p className="mt-2 text-3xl font-bold leading-none text-gray-950 dark:text-gray-50 sm:text-4xl">{value}</p>
  </div>
);

const StatusOverview: React.FC<StatusOverviewProps> = ({ applications, variant = 'full' }) => {
  const { t } = useTranslation();

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

  const compactMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const active = applications.filter(app => !['Offered', 'Rejected'].includes(app.applicationStatus)).length;
    const interviewing = applications.filter(app => app.applicationStatus === 'Interviewing').length;
    const offered = applications.filter(app => app.applicationStatus === 'Offered').length;
    const rejected = applications.filter(app => app.applicationStatus === 'Rejected').length;
    const overdue = applications.filter(app => {
      if (['Offered', 'Rejected'].includes(app.applicationStatus)) return false;
      const dueDate = toDate(app.nextActionDueDate);
      return dueDate ? dueDate < today : false;
    }).length;

    return [
      {
        label: 'Total',
        value: applications.length,
        icon: <Briefcase size={14} />,
        accent: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      },
      {
        label: 'Active',
        value: active,
        icon: <Send size={14} />,
        accent: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
      },
      {
        label: 'Interviewing',
        value: interviewing,
        icon: <Clock3 size={14} />,
        accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
      },
      {
        label: 'Offers',
        value: offered,
        icon: <Trophy size={14} />,
        accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
      },
      {
        label: 'Rejected',
        value: rejected,
        icon: <XCircle size={14} />,
        accent: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
      },
      {
        label: 'Overdue',
        value: overdue,
        icon: overdue > 0 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />,
        accent: overdue > 0
          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
      },
    ];
  }, [applications]);

  if (variant === 'compact') {
    return (
      <section className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-950/30 sm:p-4" aria-label="Pipeline summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {compactMetrics.map(metric => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-[24px] shadow-lg border border-white/50 dark:border-gray-800/50">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('job_tracker.status_overview')}</h2>
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
