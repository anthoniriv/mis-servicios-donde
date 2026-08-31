export const irreversiblePurgeConfirmation = 'ERASE_PILOT_DATA';

export function assertPurgeConfirmation(value: string | undefined): asserts value is typeof irreversiblePurgeConfirmation {
  if (value !== irreversiblePurgeConfirmation) {
    throw new Error(`Set CONFIRM_PILOT_PURGE=${irreversiblePurgeConfirmation} to irreversibly purge pilot data.`);
  }
}
