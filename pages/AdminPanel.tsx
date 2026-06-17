import React from 'react';
import { AdminAthletes } from './AdminAthletes';
import { AdminProfessors } from './AdminProfessors';
import { AdminAcademies } from './AdminAcademies';
import { AdminEvents } from './AdminEvents';
import { AdminSettings } from './AdminSettings';
import { AdminAllUsers } from './AdminAllUsers';
import { AdminAcademyCertificates } from './AdminAcademyCertificates';

interface AdminPanelProps {
  view: 'users' | 'professors' | 'academies' | 'events' | 'settings' | 'all-users' | 'academy-certificates';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ view }) => {
  const renderView = () => {
    switch (view) {
      case 'users':
        return <AdminAthletes />;
      case 'professors':
        return <AdminProfessors />;
      case 'academies':
        return <AdminAcademies />;
      case 'academy-certificates':
        return <AdminAcademyCertificates />;
      case 'events':
        return <AdminEvents />;
      case 'settings':
        return <AdminSettings />;
      case 'all-users':
        return <AdminAllUsers />;
      default:
        return <AdminAthletes />;
    }
  };

  return (
    <div className="animate-fadeIn min-h-full">
      {renderView()}
    </div>
  );
};