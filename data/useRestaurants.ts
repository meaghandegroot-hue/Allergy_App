// Loads restaurants from Supabase when it's configured, otherwise the sample list.

import { isBackendConfigured, supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Restaurant, restaurants as sampleRestaurants } from './restaurants';

type Row = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cross_contact: string;
  call_ahead: boolean;
  notes: string;
  is_sample: boolean;
  updated_at: string;
  restaurant_allergens: { allergen_id: string }[];
};

function fromRow(r: Row): Restaurant {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    address: r.address,
    latitude: r.latitude ?? 0,
    longitude: r.longitude ?? 0,
    accommodates: r.restaurant_allergens.map((x) => x.allergen_id),
    crossContact: r.cross_contact,
    callAhead: r.call_ahead,
    notes: r.notes,
    updated: r.updated_at.slice(0, 10),
    isSample: r.is_sample,
  };
}

let cache: Restaurant[] | null = null;

export function useRestaurants() {
  const [data, setData] = useState<Restaurant[]>(
    isBackendConfigured ? cache ?? [] : sampleRestaurants
  );
  const [loading, setLoading] = useState(isBackendConfigured && !cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('restaurants')
      .select(
        'id, name, cuisine, address, latitude, longitude, cross_contact, call_ahead, notes, is_sample, updated_at, restaurant_allergens(allergen_id)'
      )
      .eq('is_listed', true)
      .order('name')
      .then(({ data: rows, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError('Couldn’t load restaurants. Check your connection and try again.');
        } else {
          cache = (rows as Row[]).map(fromRow);
          setData(cache);
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { restaurants: data, loading, error };
}
