"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DataBar } from './DataBar';
import { formatDateBR } from '../../utils/formatters';
import { SmartProfileImage } from './SmartProfileImage';
import { formatNameForMobile } from '../../utils/nameFormatter';
import { formatBeltForDisplay } from '../../utils/beltFormatter';

/**
 * [INSTRUÇÃO CRÍTICA PARA IA - NÃO MODIFICAR]: 
 * 1. O logotipo e o texto da CBJJS devem manter o recuo de -30px (ml-[-30px]).
 * 2. O texto "Confederação Brasileira de Jiu-Jitsu Social" deve ter quebra de linha após "Brasileira de".
 * 3. A coluna da foto deve estar centralizada verticalmente (justify-center).
 * Estas regras são requisitos visuais fixos da CBJJS.
 */

interface IDCardMobileProps {
    fullName: string;
    profileImage?: string;
    federationId?: number;
    dob: string;
    belt: string;
    academyName: string;
    paymentConfirmedAt?: string;
    responsavel?: string;
}

export const IDCardMobile: React.FC<IDCardMobileProps> = ({ 
    fullName, profileImage, federationId, dob, belt, academyName, paymentConfirmedAt, responsavel
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.4);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth;
                const newScale = (parentWidth - 10) / 745;
                setScale(newScale);
            }
        };
        updateScale();
        const timer = setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

    const federationDate = paymentConfirmedAt ? new Date(paymentConfirmedAt) : new Date();
    const expirationDate = new Date(federationDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    const formattedId = federationId ? String(federationId).padStart(6, '0') : '---';

    const displayFullName = formatNameForMobile(fullName);
    const displayResponsavel = responsavel ? formatNameForMobile(responsavel) : null;

    return (
        <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
            <div 
                className="relative origin-top"
                style={{ 
                    width: '745px', 
                    height: '470px',
                    transform: `scale(${scale})`,
                    marginBottom: `-${470 * (1 - scale)}px`
                }}
            >
                <div className="id-card-root w-[745px] h-[470px] bg-[#1a365d] rounded-[24px] shadow-2xl relative flex p-10 border border-white/10 select-none">
                    <style>{`
                        .id-card-root {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}</style>

                    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none p-12">
                        <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="Watermark" className="w-full h-auto max-w-[400px] grayscale" />
                    </div>

                    {/* [ALINHAMENTO]: justify-center para centralizar a foto verticalmente */}
                    <div className="w-[32%] flex flex-col justify-center z-10">
                        <div className="w-full aspect-[3/4] bg-white rounded-2xl overflow-hidden border-[4px] border-white shadow-lg">
                            <SmartProfileImage src={profileImage} />
                        </div>
                    </div>

                    <div className="w-[68%] flex flex-col pl-10 z-10 justify-center">
                        {/* [AJUSTE LOGO]: gap-1.5 para máxima proximidade visual */}
                        <div className="flex items-center gap-1.5 mb-6 ml-[-30px]">
                             <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS" className="w-[6rem] h-[6rem] shrink-0 drop-shadow-lg" />
                             <div className="flex flex-col">
                                <h2 className="text-5xl font-black text-white leading-none tracking-tighter italic">CBJJS</h2>
                                {/* [TEXTO]: Quebra de linha manual obrigatória para ajuste visual */}
                                <span className="text-[11px] text-cbjjs-gold font-black uppercase tracking-[0.15em] leading-tight mt-0.5">
                                    Confederação Brasileira de <br /> Jiu-Jitsu Social
                                </span>
                             </div>
                        </div>

                        <div className="flex flex-col space-y-2.5">
                            <DataBar label="Nome" value={displayFullName} labelClass="text-[16px]" valueClass="text-[16px]" />
                            {displayResponsavel ? (
                                <DataBar label="Responsável" value={displayResponsavel} labelClass="text-[16px]" valueClass="text-[16px]" />
                            ) : (
                                <DataBar label="Academia" value={academyName} labelClass="text-[16px]" valueClass="text-[16px]" />
                            )}
                            <DataBar label="Faixa" value={formatBeltForDisplay(belt)} labelClass="text-[16px]" valueClass="text-[16px]" />
                            <DataBar label="Nascimento" value={formatDateBR(dob)} labelClass="text-[16px]" valueClass="text-[16px]" />
                        </div>

                        <div className="mt-6 pt-4 flex items-center gap-8 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-black text-white/50 uppercase tracking-widest">Matrícula:</span>
                                <span className="text-[16px] font-black text-white font-mono">{formattedId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-black text-white/50 uppercase tracking-widest">Validade:</span>
                                <span className="text-[16px] font-black text-white">{expirationDate.toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};