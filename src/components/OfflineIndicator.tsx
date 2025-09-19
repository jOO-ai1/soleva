import React from 'react';
import { useNetworkStatus } from '../services/networkService';
import { FiWifi, FiWifiOff, FiCloud, FiCloudOff } from 'react-icons/fi';

const OfflineIndicator: React.FC = () => {
  const { isOnline, apiAvailable } = useNetworkStatus();

  // Only show indicator when there are connectivity issues
  if (isOnline && apiAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        {!isOnline ? (
          <>
            <FiWifiOff className="text-lg" />
            <span>No Internet Connection</span>
          </>
        ) : (
          <>
            <FiCloudOff className="text-lg" />
            <span>Using Offline Data</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
