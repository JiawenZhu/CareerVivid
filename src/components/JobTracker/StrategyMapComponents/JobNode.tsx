import React from 'react';
import { Handle, Position } from 'reactflow';
import { Briefcase } from 'lucide-react';

const JobNode = ({ data }: { data: any }) => {
    return (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 shadow-md min-w-[220px] flex items-center gap-3">
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white dark:!border-gray-900"
            />
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded-lg shrink-0">
                <Briefcase size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate" title={data.label}>
                    {data.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1" title={data.subLabel}>
                    {data.subLabel}
                </div>
                {data.matches && (
                    <div className="mt-1 text-[10px] text-gray-400 font-medium">
                        {data.matches} match{data.matches !== 1 ? 'es' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(JobNode);
