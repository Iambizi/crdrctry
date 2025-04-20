import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('Successfully authenticated with PocketBase');
  } catch (error) {
    console.error('Failed to authenticate with PocketBase:', error);
    throw error;
  }
}

async function updateCollectionSettings() {
  try {
    await authenticateAdmin();
    
    // Update brands collection
    const brandsCollection = await pb.collections.getOne('brands');
    await pb.collections.update(brandsCollection.id, {
      name: brandsCollection.name,
      listRule: brandsCollection.listRule,
      viewRule: brandsCollection.viewRule,
      createRule: brandsCollection.createRule,
      updateRule: brandsCollection.updateRule,
      deleteRule: brandsCollection.deleteRule,
      schema: brandsCollection.schema,
      options: {
        ...brandsCollection.options,
        displayField: 'name'
      }
    });
    console.log('Updated brands collection settings');

    // Update designers collection
    const designersCollection = await pb.collections.getOne('designers');
    await pb.collections.update(designersCollection.id, {
      name: designersCollection.name,
      listRule: designersCollection.listRule,
      viewRule: designersCollection.viewRule,
      createRule: designersCollection.createRule,
      updateRule: designersCollection.updateRule,
      deleteRule: designersCollection.deleteRule,
      schema: designersCollection.schema,
      options: {
        ...designersCollection.options,
        displayField: 'name'
      }
    });
    console.log('Updated designers collection settings');

    // Update tenures collection
    const tenuresCollection = await pb.collections.getOne('tenures');
    await pb.collections.update(tenuresCollection.id, {
      name: tenuresCollection.name,
      listRule: tenuresCollection.listRule,
      viewRule: tenuresCollection.viewRule,
      createRule: tenuresCollection.createRule,
      updateRule: tenuresCollection.updateRule,
      deleteRule: tenuresCollection.deleteRule,
      schema: tenuresCollection.schema,
      options: {
        ...tenuresCollection.options,
        displayField: 'role'
      }
    });
    console.log('Updated tenures collection settings');

    // Update relationships collection
    const relationshipsCollection = await pb.collections.getOne('relationships');
    await pb.collections.update(relationshipsCollection.id, {
      name: relationshipsCollection.name,
      listRule: relationshipsCollection.listRule,
      viewRule: relationshipsCollection.viewRule,
      createRule: relationshipsCollection.createRule,
      updateRule: relationshipsCollection.updateRule,
      deleteRule: relationshipsCollection.deleteRule,
      schema: relationshipsCollection.schema,
      options: {
        ...relationshipsCollection.options,
        displayField: 'type'
      }
    });
    console.log('Updated relationships collection settings');

    console.log('Successfully updated all collection settings');
  } catch (error) {
    console.error('Failed to update collection settings:', error);
    process.exit(1);
  }
}

updateCollectionSettings();
