import React from 'react';
import { Upload } from 'lucide-react';

interface CustomUploadButtonProps {
  onClick: () => void;
  label?: string;
}

export const CustomUploadButton: React.FC<CustomUploadButtonProps> = ({ onClick, label }) => {
  return (
    <div className="relative w-32 h-32 group mx-auto cursor-pointer" onClick={onClick}>
      <div className="relative z-40 group-hover:translate-x-4 group-hover:shadow-2xl group-hover:-translate-y-4 transition-all duration-500 bg-gray-900 flex items-center justify-center h-full w-full rounded-2xl">
        <Upload className="h-8 w-8 text-white/60" />
      </div>
      <div className="absolute border opacity-0 group-hover:opacity-100 transition-all duration-300 border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-full w-full rounded-2xl" />
      {label && <p className="absolute -bottom-8 left-0 right-0 text-center text-xs font-medium text-gray-500">{label}</p>}
    </div>
  );
};