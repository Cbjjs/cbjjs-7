import React from 'react';
import { User } from '../../types';
import { IDCardView } from '../id-card/IDCardView';

interface BatchPrintViewProps {
  athletes: User[];
  academyName: string;
}

export const BatchPrintView: React.FC<BatchPrintViewProps> = ({ athletes, academyName }) => {
  if (athletes.length === 0) return null;

  return (
    <div className="hidden print:block print:bg-white print:p-0 w-full">
      <div className="grid grid-cols-2 gap-4">
        {athletes.map((athlete) => (
          <div key={athlete.id} className="break-inside-avoid mb-6">
            <IDCardView 
                fullName={athlete.fullName}
                profileImage={athlete.profileImage}
                federationId={athlete.federationId}
                dob={athlete.dob}
                belt={athlete.athleteData?.belt || 'Branca'}
                academyName={academyName}
                paymentConfirmedAt={athlete.paymentConfirmedAt}
                responsavel={athlete.isDependent ? athlete.parentName : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};