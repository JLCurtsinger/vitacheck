/**
 * Map of common brand names to their generic active ingredients
 * This is a static mapping for quick lookups without an API call
 */
export const BRAND_TO_GENERIC: Record<string, string> = {
  // Psychiatric medications
  "xanax": "alprazolam",
  "lexapro": "escitalopram",
  "prozac": "fluoxetine",
  "zoloft": "sertraline",
  "wellbutrin": "bupropion",
  "celexa": "citalopram",
  "ativan": "lorazepam",
  "valium": "diazepam",
  "klonopin": "clonazepam",
  "ritalin": "methylphenidate",
  "adderall": "amphetamine/dextroamphetamine",
  "ambien": "zolpidem",
  "lunesta": "eszopiclone",
  
  // Pain medications
  "tylenol": "acetaminophen",
  "advil": "ibuprofen",
  "motrin": "ibuprofen",
  "aleve": "naproxen",
  "bayer": "aspirin",
  "excedrin": "acetaminophen/aspirin/caffeine",
  "vicodin": "hydrocodone/acetaminophen",
  "percocet": "oxycodone/acetaminophen",
  "oxycontin": "oxycodone",
  "celebrex": "celecoxib",
  
  // Blood pressure / heart medications
  "lipitor": "atorvastatin",
  "crestor": "rosuvastatin",
  "zocor": "simvastatin",
  "prinivil": "lisinopril",
  "zestril": "lisinopril",
  "toprol": "metoprolol",
  "norvasc": "amlodipine",
  "coumadin": "warfarin",
  "plavix": "clopidogrel",
  "lasix": "furosemide",
  
  // Gastrointestinal medications
  "prilosec": "omeprazole",
  "nexium": "esomeprazole",
  "prevacid": "lansoprazole",
  "zantac": "ranitidine",
  "pepcid": "famotidine",
  "imodium": "loperamide",
  
  // Allergy medications
  "claritin": "loratadine",
  "zyrtec": "cetirizine",
  "allegra": "fexofenadine",
  "benadryl": "diphenhydramine",
  "flonase": "fluticasone",
  "nasacort": "triamcinolone",
  
  // Diabetes medications
  "glucophage": "metformin",
  "januvia": "sitagliptin",
  "lantus": "insulin glargine",
  "humalog": "insulin lispro",
  
  // Other common medications
  "synthroid": "levothyroxine",
  "viagra": "sildenafil",
  "cialis": "tadalafil",
  
  // Common supplements
  "centrum": "multivitamin",
  "tums": "calcium carbonate",
  "metamucil": "psyllium",
  "airborne": "vitamin c/zinc/herbal blend"
};

/**
 * Returns the generic name for a brand name medication
 * If no mapping is found, returns the original name
 */
export function getGenericName(brandName: string): string {
  if (!brandName) return "";
  
  const normalizedName = brandName.toLowerCase().trim();
  
  // Check if we have an exact match
  if (BRAND_TO_GENERIC[normalizedName]) {
    return BRAND_TO_GENERIC[normalizedName];
  }
  
  // Check if we have a partial match (for compound names)
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (normalizedName.includes(brand)) {
      return generic;
    }
  }
  
  // If no match found, return the original name
  return brandName;
}

/**
 * Checks if a medication name is likely a brand name
 */
export function isBrandName(medicationName: string): boolean {
  if (!medicationName) return false;
  
  const normalizedName = medicationName.toLowerCase().trim();
  
  // Check exact matches
  if (BRAND_TO_GENERIC[normalizedName]) {
    return true;
  }
  
  // Check partial matches
  for (const brand of Object.keys(BRAND_TO_GENERIC)) {
    if (normalizedName.includes(brand)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Returns both generic and brand names for display purposes
 */
export function getMedicationNamePair(name: string): { 
  displayName: string; 
  genericName: string;
  isBrand: boolean;
} {
  const isBrand = isBrandName(name);
  
  if (isBrand) {
    return {
      displayName: name,
      genericName: getGenericName(name),
      isBrand: true
    };
  } else {
    return {
      displayName: name,
      genericName: name,
      isBrand: false
    };
  }
}
