import { FashionUpdate } from './types';
import { gqlClient } from '../../lib/graphqlClient';

export async function submitUpdate(update: FashionUpdate, mode: 'live' | 'historical') {
  // Different mutations based on mode
  const mutations = {
    // For live updates, we want to add the update with high priority
    live: `
      mutation AddTenure($input: TenureInput!) {
        addTenure(input: $input) {
          id
        }
      }
    `,
    // For historical data, we might want to use a different mutation or add metadata
    historical: `
      mutation AddHistoricalTenure($input: TenureInput!) {
        addTenure(input: $input) {
          id
        }
      }
    `
  };

  const mutation = mutations[mode];
  console.log(`Submitting ${mode} update for ${update.designerName} at ${update.brandName}`);
  
  try {
    const result = await gqlClient.request<{ addTenure: { id: string } }>(mutation, {
      input: {
        designer: update.designerName,
        brand: update.brandName,
        role: update.role,
        start_year: update.startYear,
        // Add source information for tracking
        source_url: update.sourceUrl,
        // Add metadata about the update mode
        metadata: { mode, timestamp: new Date().toISOString() }
      },
    });
    
    console.log(`Successfully submitted update with ID: ${result.addTenure?.id || 'unknown'}`);
    return result;
  } catch (error) {
    console.error(`Error submitting ${mode} update:`, error);
    throw error; // Re-throw to allow caller to handle the error
  }
}
