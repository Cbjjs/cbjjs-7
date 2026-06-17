import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Senha", 
  required = true, 
  minLength = 6,
  id
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group">
      <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-cbjjs-blue transition-colors" size={20} />
      
      <input 
        id={id}
        type={showPassword ? "text" : "password"} 
        placeholder={placeholder} 
        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-cbjjs-blue focus:border-transparent outline-none transition-all placeholder-gray-400"
        required={required}
        minLength={minLength}
        value={value}
        onChange={e => onChange(e.target.value)} 
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-cbjjs-blue transition-colors rounded-lg hover:bg-white shadow-sm md:shadow-none"
        title={showPassword ? "Esconder senha" : "Mostrar senha"}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};