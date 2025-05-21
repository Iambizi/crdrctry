import { fetchSources } from './sources';
import { processUpdate } from './processor';
import { verifyUpdate } from './verifier';
import { submitUpdate } from './submitter';
import { FashionUpdate } from './types';

export async function runFashionNewsAgent(mode: 'live' | 'historical') {
  const rawItems = await fetchSources(mode);

  for (const item of rawItems) {
    const update: FashionUpdate = await processUpdate(item, mode);
    const isValid = await verifyUpdate(update);

    if (isValid) {
      await submitUpdate(update, mode);
    }
  }
}
