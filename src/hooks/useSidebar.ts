import { useState } from 'react';

export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availability, setAvailability] = useState(true);

  return {
    sidebarOpen,
    availability,
    setAvailability,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
  };
}
