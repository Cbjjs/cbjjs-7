"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';

export const SmartProfileImage: React.FC<SmartProfileImageProps> = ({ src, className = "" }) => {
    // [REGRA CBJJS]: A imagem deve estar SEMPRE centralizada verticalmente (object-center)
    const [objectPosition, setObjectPosition] = useState<'center'>('center');
    const imgRef = useRef<HTMLElement>(null);

    const detectOrientation = (img: HTMLImageElement) => {
        // Forçando centro vertical conforme solicitado pelo usuário
        setObjectPosition('center');
    };

    useEffect(() => {
        if (!src) return;
        if (imgRef.current && (imgRef.current as any).complete) {
            detectOrientation(imgRef.current as any);
        }
    }, [src]);

    if (!src) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}>
                <Shield className="w-16 h-16" />
            </div>
        );
    }

    return (
        <img 
            ref={imgRef as any}
            src={src} 
            alt="Profile" 
            crossOrigin="anonymous"
            onLoad={(e) => detectOrientation(e.currentTarget)}
            className={`w-full h-full object-cover ${className}`}
            style={{ objectPosition: objectPosition }}
        />
    );
};

interface SmartProfileImageProps {
    src?: string;
    className?: string;
}