# Fashion Directory Database Scripts

## Migration Tool

The new migration tool (`resetAndPopulate2.ts`) provides a safer way to update the database while preserving existing data and relationships.

### Features

- Safe updates by default (no data deletion)
- Dry run mode to preview changes
- Duplicate handling
- Relationship preservation
- Detailed logging and error reporting

### Usage

1. **Safe Migration (Recommended)**
   ```bash
   yarn db:migrate
   ```
   This is the default mode that:
   - Preserves existing data
   - Skips duplicates
   - Maintains relationships
   - Reports detailed statistics

2. **Dry Run**
   ```bash
   yarn db:migrate:dry
   ```
   Preview changes without modifying the database:
   - Shows what would be created/updated
   - Reports potential conflicts
   - No actual changes made

3. **Force Update**
   ```bash
   yarn db:migrate:force
   ```
   ⚠️ Use with caution! This mode:
   - Deletes existing data
   - Performs clean migration
   - Best for initial setup

4. **Update All**
   ```bash
   yarn db:migrate:update
   ```
   Updates all records, including duplicates:
   - No skipping of existing records
   - Updates all fields
   - Maintains relationships

### Troubleshooting

1. **Missing References**
   - Check if all required brands and designers exist
   - Verify ID mappings in source data
   - Look for skipped items in logs

2. **Duplicate Records**
   - Use `--dry-run` to identify duplicates
   - Consider using `--no-skip` to update them
   - Check source data for duplicates

3. **Data Integrity**
   - Run `yarn db:schema` first if needed
   - Verify PocketBase is running
   - Check database connection
   - Review error messages

4. **Performance**
   - Large migrations may take time
   - Watch for memory usage
   - Consider batching updates

### Best Practices

1. Always run with `--dry-run` first
2. Back up data before force updates
3. Check logs for skipped items
4. Verify data counts after migration
5. Use appropriate mode for your needs
