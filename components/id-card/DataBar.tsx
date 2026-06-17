import React from 'react';

interface DataBarProps {
    label: string;
    value: string;
    labelClass?: string;
    valueClass?: string;
}

export const DataBar: React.FC<DataBarProps> = ({ 
    label, 
    value, 
    labelClass = "text-[13px]", 
    valueClass = "text-[13px]" 
}) => (
    <div className="bg-white rounded-l-full h-[2.5rem] flex items-center px-6 shadow-sm border-b border-gray-100/50 transition-all">
        <span className={`${labelClass} font-black text-black uppercase tracking-tighter mr-3 shrink-0 whitespace-nowrap`}>{label}</span>
        <span className={`${valueClass} font-bold text-gray-800 uppercase truncate whitespace-nowrap`}>{value}</span>
    </div>
);