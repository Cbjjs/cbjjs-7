"use client";

import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface SmartProfileImageProps {
    src?: string;
    className?: string;
}

/**
 * Componente inteligente que detecta se a foto foi tirada em pé (proporção vertical)
 * e ajusta o enquadramento para priorizar o topo (rosto) ao invés do centro.
 */
export const SmartProfileImage: React.FC<SmartProfileImageProps> = ({ src, className = "" }) => {
    const [isVertical, setIsVertical] = useState(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        // Se a altura for maior que a largura, identificamos como foto em pé (celular)
        if (img.naturalHeight > img.naturalWidth) {
            setIsVertical(true);
        }
    };

    if (!src) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}>
                <Shield className="w-16 h-16" />
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt="Profile" 
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover ${isVertical ? 'object-top' : 'object-center'} ${className}`} 
        />
    );
};