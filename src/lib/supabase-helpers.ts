/**
 * Supabase Helper Functions
 * Common database operations for API routes
 */

import { supabase } from './supabase';

/**
 * Generic fetch with error handling
 */
export async function fetchFromSupabase<T>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
) {
  let query = supabase.from(table).select(options.select || '*');

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Execute query
  if (options.single) {
    const { data, error } = await query.single();
    return { data: data as T | null, error };
  }

  const { data, error } = await query;
  return { data: data as T[] | null, error };
}

/**
 * Insert data into Supabase
 */
export async function insertIntoSupabase<T>(table: string, data: any) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  return { data: result as T | null, error };
}

/**
 * Update data in Supabase
 */
export async function updateInSupabase<T>(
  table: string,
  id: string,
  data: any
) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as T | null, error };
}

/**
 * Delete from Supabase
 */
export async function deleteFromSupabase(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error };
}

/**
 * Increment a numeric field
 */
export async function incrementField(
  table: string,
  id: string,
  field: string,
  amount: number
) {
  // Get current value
  const { data: current } = await supabase
    .from(table)
    .select(field)
    .eq('id', id)
    .single();

  if (!current) return { error: new Error('Record not found') };

  const newValue = (current[field] || 0) + amount;

  const { data, error } = await supabase
    .from(table)
    .update({ [field]: newValue })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Batch fetch by IDs
 */
export async function fetchByIds<T>(
  table: string,
  ids: string[],
  select: string = '*'
) {
  if (ids.length === 0) return { data: [] as T[], error: null };

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in('id', ids);

  return { data: data as T[] | null, error };
}
