"use client";

import { useState, useCallback, useEffect } from "react";
import { calculateDistanceMeters } from "@/lib/utils/haversine";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceOptions {
  officeLatitude?: number;
  officeLongitude?: number;
  radiusMeters?: number; // default: 150m
}

export interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  distanceToOffice: number | null;
  isInsideGeofence: boolean | null;
  requestLocation: () => Promise<Coordinates | null>;
}

export function useGeolocation(options: GeofenceOptions = {}): GeolocationState {
  const {
    officeLatitude,
    officeLongitude,
    radiusMeters = 150,
  } = options;

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean | null>(null);

  const evaluateGeofence = useCallback(
    (coords: Coordinates) => {
      if (
        typeof officeLatitude === "number" &&
        typeof officeLongitude === "number"
      ) {
        const distance = calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          officeLatitude,
          officeLongitude
        );
        setDistanceToOffice(distance);
        setIsInsideGeofence(distance <= radiusMeters);
      } else {
        setDistanceToOffice(null);
        setIsInsideGeofence(true); // If no office location configured, consider verified
      }
    },
    [officeLatitude, officeLongitude, radiusMeters]
  );

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoordinates(coords);
          evaluateGeofence(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let errorMsg = "Unable to retrieve GPS coordinates";
          if (err.code === 1) {
            errorMsg = "Location access denied by user";
          } else if (err.code === 2) {
            errorMsg = "Location unavailable";
          } else if (err.code === 3) {
            errorMsg = "Location request timed out";
          }
          setError(errorMsg);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [evaluateGeofence]);

  // Optionally auto-fetch location on initial mount if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      requestLocation();
    }
  }, [requestLocation]);

  return {
    coordinates,
    loading,
    error,
    distanceToOffice,
    isInsideGeofence,
    requestLocation,
  };
}
