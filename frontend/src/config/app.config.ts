// Application configuration

export const APP_CONFIG = {
  // Echo feed settings
  NEARBY_ECHOES_RADIUS_METERS: 500000, // 50km radius for nearby echoes

  // Default location (fallback if user denies location access)
  DEFAULT_LOCATION: {
    lat: 0,
    lng: 0,
  },

  // Feed settings
  MAX_ECHOES_PER_LOAD: 50,

  // Location settings
  LOCATION_TIMEOUT_MS: 5000,
  LOCATION_MAX_AGE_MS: 60000, // Cache location for 1 minute
} as const;

export default APP_CONFIG;
