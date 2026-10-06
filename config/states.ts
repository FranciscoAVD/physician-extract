/**
 * Two-letter US state/territory codes to restrict the extract to, matched
 * against each physician's *practice location* state (not their mailing
 * address). Matches the "Provider Business Practice Location Address State
 * Name" column in the NPPES file.
 *
 * Leave this empty to keep physicians from every state/territory.
 */
export const allowedStates: string[] = [];
