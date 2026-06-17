import React from 'react';
import { IDCardDesktop } from './IDCardDesktop';
import { IDCardMobile } from './IDCardMobile';

interface IDCardViewProps {
    fullName: string;
    profileImage?: string;
    federationId?: number;
    dob: string;
    belt: string;
    academyName: string;
    paymentConfirmedAt?: string;
    responsavel?: string;
}

export const IDCardView: React.FC<IDCardViewProps> = (props) => {
    return (
        <div className="w-full">
            {/* Versão Desktop: Visível no desktop OU sempre na impressão */}
            <div className="hidden md:block print:block">
                <IDCardDesktop {...props} />
            </div>

            {/* Versão Mobile: Visível apenas no mobile e NUNCA na impressão */}
            <div className="block md:hidden print:hidden">
                <IDCardMobile {...props} />
            </div>
        </div>
    );
};