import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';

const ResumeNode = ({ data }: { data: any }) => {
    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm min-w-[200px] flex items-center gap-3">
            <div className="bg-blue-500 text-white p-2 rounded-lg shrink-0">
                <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-blue-100 text-sm truncate" title={data.label}>
                    {data.label}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300 truncate" title={data.subLabel}>
                    {data.subLabel || 'Resume'}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white dark:!border-gray-900"
            />
        </div>
    );
};

export default React.memo(ResumeNode);
