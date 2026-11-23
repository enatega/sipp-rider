import { useState } from 'react';
import { useRiderAvailability } from './useRiderAvailability';

export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { availability, setAvailability, isPending } = useRiderAvailability();

  return {
    sidebarOpen,
    availability,
    setAvailability,
    isAvailabilityPending: isPending,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
  };
}
