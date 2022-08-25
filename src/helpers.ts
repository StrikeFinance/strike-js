import { StrikeInstance } from './types';

/**
 * This function acts like a decorator for all methods that interact with the
 *     blockchain. In order to use the correct Strike Protocol addresses, the
 *     Strike.js SDK must know which network its provider points to. This
 *     function holds up a transaction until the main constructor has determined
 *     the network ID.
 *
 * @hidden
 *
 * @param {Strike} _strike The instance of the Strike.js SDK.
 *
 */
export async function netId(_strike: StrikeInstance): Promise<void> {
  if (_strike._networkPromise) {
    await _strike._networkPromise;
  }
}
