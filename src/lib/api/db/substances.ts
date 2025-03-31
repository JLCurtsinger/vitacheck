
import { supabase } from "@/integrations/supabase/client";
import { Substance, SubstanceOrigin, SubstanceType, DbResult } from "./types";
import { normalizeMedicationName } from "../utils/name-normalizer";

/**
 * Get a substance by name
 * @param name Substance name
 * @returns Substance data or null if not found
 */
export async function getSubstanceByName(name: string): Promise<DbResult<Substance>> {
  const normalizedName = normalizeMedicationName(name);
  
  const { data, error } = await supabase
    .from('substances')
    .select('*')
    .ilike('name', normalizedName)
    .maybeSingle();
  
  return { data, error };
}

/**
 * Get a substance by id
 * @param id Substance UUID
 * @returns Substance data or null if not found
 */
export async function getSubstanceById(id: string): Promise<DbResult<Substance>> {
  const { data, error } = await supabase
    .from('substances')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  return { data, error };
}

/**
 * Get all substances, with optional filtering
 * @param type Optional filter by substance type
 * @param origin Optional filter by substance origin
 * @returns Array of substances matching criteria
 */
export async function getSubstances(
  type?: SubstanceType,
  origin?: SubstanceOrigin
): Promise<DbResult<Substance[]>> {
  let query = supabase.from('substances').select('*');
  
  if (type) {
    query = query.eq('type', type);
  }
  
  if (origin) {
    query = query.eq('origin', origin);
  }
  
  const { data, error } = await query;
  return { data, error };
}

/**
 * Create a new substance record
 * @param substance Substance data to create
 * @returns Created substance or error
 */
export async function createSubstance(substance: Omit<Substance, 'id' | 'created_at' | 'updated_at'>): Promise<DbResult<Substance>> {
  const normalizedName = normalizeMedicationName(substance.name);
  
  const { data, error } = await supabase
    .from('substances')
    .insert({
      name: normalizedName, // Store name in normalized form
      display_name: substance.display_name,
      type: substance.type,
      rxcui: substance.rxcui,
      description: substance.description,
      origin: substance.origin
    })
    .select()
    .maybeSingle();
  
  return { data, error };
}

/**
 * Find or create a substance by name
 * @param name Substance name
 * @param type Substance type
 * @param origin Data origin
 * @returns Substance data
 */
export async function findOrCreateSubstance(
  name: string,
  type: SubstanceType = 'medication',
  origin: SubstanceOrigin = 'User'
): Promise<Substance | null> {
  if (!name) {
    console.error('Cannot find or create substance: name is empty');
    return null;
  }
  
  const normalizedName = normalizeMedicationName(name);
  
  // First try to find the substance
  const { data: existingSubstance } = await getSubstanceByName(normalizedName);
  
  if (existingSubstance) {
    console.log(`Found existing substance: ${normalizedName}`);
    return existingSubstance;
  }
  
  // If not found, create a new substance record
  const displayName = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  const { data: newSubstance, error } = await createSubstance({
    name: normalizedName,
    display_name: displayName,
    type,
    origin
  });
  
  if (error) {
    console.error('Error creating substance:', error);
    return null;
  }
  
  console.log(`Created new substance: ${normalizedName}`);
  return newSubstance;
}
