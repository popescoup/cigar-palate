import React from 'react';
import { User } from '@/types/user';

interface OPBadgeProps {
  user: User;
  threadCreatorId: number;
}

const OPBadge: React.FC<OPBadgeProps> = ({ user, threadCreatorId }) => {
  if (user.id !== threadCreatorId) return null;
  
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded ml-2">
      OP
    </span>
  );
};

export default OPBadge;