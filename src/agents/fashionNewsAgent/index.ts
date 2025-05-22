import { fetchSources } from './sources';
import { processUpdate } from './processor';
import { verifyUpdate } from './verifier';
import { submitUpdate } from './submitter';
import { FashionUpdate } from './types';

export async function runFashionNewsAgent(mode: 'live' | 'historical') {
  console.log(`[Agent] Starting in ${mode.toUpperCase()} mode...`);
  const rawItems = await fetchSources(mode);
  console.log(`[Agent] Retrieved ${rawItems.length} news items`);

  for (const item of rawItems) {
    try {
      const update: FashionUpdate = await processUpdate(item, mode);
      const isValid = await verifyUpdate(update);

      if (isValid) {
        await submitUpdate(update, mode);
        console.log(`[Agent] Submitted update: ${update.designerName} at ${update.brandName}`);
      } else {
        console.warn(`[Agent] Skipped low-confidence update: ${item.title}`);
      }
    } catch (err) {
      console.error(`[Agent] Failed processing item: ${item.title}`, err);
    }
  }

  console.log(`[Agent] Finished processing.`);
}

