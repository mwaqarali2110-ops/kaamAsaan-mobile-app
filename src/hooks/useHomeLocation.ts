import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';

const HOME_LOCATION_STORAGE_KEY = 'kaamasaan.home.location';
const FALLBACK_LOCATION = 'Islamabad, Pakistan';

const formatCityLocation = (city?: string | null) => {
  const normalizedCity = city?.trim();
  if (!normalizedCity) return null;
  return normalizedCity.toLowerCase().includes('pakistan') ? normalizedCity : `${normalizedCity}, Pakistan`;
};

export const useHomeLocation = () => {
  const profileCity = useAuthStore((state) => state.profile?.city);
  const [cachedLocation, setCachedLocation] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(HOME_LOCATION_STORAGE_KEY).then((storedLocation) => {
      if (mounted && storedLocation) setCachedLocation(storedLocation);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const profileLocation = formatCityLocation(profileCity);

  useEffect(() => {
    if (!profileLocation) return;
    setCachedLocation(profileLocation);
    void AsyncStorage.setItem(HOME_LOCATION_STORAGE_KEY, profileLocation);
  }, [profileLocation]);

  return useMemo(
    () => ({
      locationLabel: profileLocation || cachedLocation || FALLBACK_LOCATION,
      source: profileLocation ? 'profile' : cachedLocation ? 'cached' : 'fallback'
    }),
    [cachedLocation, profileLocation]
  );
};
