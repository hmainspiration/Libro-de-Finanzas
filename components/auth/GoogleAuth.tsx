// FIX: Added missing React import to resolve TypeScript error.
import React from 'react';

// This component is no longer used in the new automatic authentication flow.
// It is kept as an empty file to prevent import errors if it were referenced,
// but it can be safely deleted.
const GoogleAuth: React.FC = () => {
  return null;
};
export default GoogleAuth;
