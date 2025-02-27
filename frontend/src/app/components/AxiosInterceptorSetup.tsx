// src/app/components/AxiosInterceptorSetup.tsx

/*
	•	Sets up Axios interceptors globally by calling setupAxiosInterceptors from the axiosConfig utility when the component mounts.
	•	Does not render any UI, serving solely as a setup component to apply Axios configurations, such as handling credentials automatically in requests.
*/

"use client";

import { useEffect } from 'react';
import setupAxiosInterceptors from '../../utils/axiosConfig';

export default function AxiosInterceptorSetup() {
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  return null; // This component doesn't render anything
}