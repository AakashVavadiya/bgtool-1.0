/**
 * Single source of truth for public API models.
 * Internal/legacy models (narmada, saraswati, isnet, u2net) remain internal to engine backends.
 */
export const PUBLIC_MODELS = ["karudi", "ganga", "brahmaputra"] as const;

export type PublicModel = (typeof PUBLIC_MODELS)[number];

export const DEFAULT_PUBLIC_MODEL: PublicModel = "ganga";

/**
 * Validates whether a model string is an approved public model.
 */
export function isValidPublicModel(model: string): model is PublicModel {
  return (PUBLIC_MODELS as readonly string[]).includes(model.toLowerCase().trim());
}
