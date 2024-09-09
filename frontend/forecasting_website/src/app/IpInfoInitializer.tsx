'use client';

import { useEffect, useRef } from 'react';
import { useForecastStore } from './store/forecastStore';

export default function IpInfoInitializer() {
  const { initializeIpInfo, ipInfo } = useForecastStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && !ipInfo) {
      initialized.current = true;
      initializeIpInfo();
    }
  }, [initializeIpInfo, ipInfo]);

  return null;
}