import { taxonomyCodes } from "../config/taxonomy-codes";
import { allowedStates } from "../config/states";

export const physicianTaxonomyCodes = new Set(taxonomyCodes);

const stateSet = new Set(allowedStates);

export function isAllowedState(stateCode: string): boolean {
  if (stateSet.size === 0) return true;
  return stateSet.has(stateCode);
}
