const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// SQLite database path
const dbPath = path.join(__dirname, '..', 'help', 'Mlmpak', 'prisma', 'dev.db');
const outputDir = path.join(__dirname, '..', 'migration-output');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Open SQLite database
let db;
try {
  db = new Database(dbPath, { readonly: true });
  console.log('✅ Connected to SQLite database');
} catch (err) {
  console.error('Error opening database:', err.message);
  process.exit(1);
}

// Data type conversion mapping
const convertDataType = (sqliteType) => {
  const type = sqliteType.toUpperCase();
  if (type.includes('TEXT')) return 'TEXT';
  if (type.includes('INTEGER')) return 'INTEGER';
  if (type.includes('REAL') || type.includes('NUMERIC')) return 'NUMERIC';
  if (type.includes('BLOB')) return 'BYTEA';
  if (type.includes('DATETIME')) return 'TIMESTAMP';
  if (type.includes('BOOLEAN')) return 'BOOLEAN';
  return 'TEXT'; // Default to TEXT
};

// Escape PostgreSQL values
const escapeValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  
  // Escape single quotes
  const stringValue = String(value).replace(/'/g, "''");
  return `'${stringValue}'`;
};

// Get all tables
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  console.log(`\n📊 Found ${tables.length} tables to export\n`);

  let allSQL = [];
  allSQL.push('-- PostgreSQL Migration Script');
  allSQL.push('-- Generated from SQLite database');
  allSQL.push(`-- Date: ${new Date().toISOString()}`);
  allSQL.push('-- Tables: ' + tables.length);
  allSQL.push('\n-- Disable triggers during import');
  allSQL.push('SET session_replication_role = replica;');
  allSQL.push('\n');

  for (const table of tables) {
    const tableName = table.name;
    console.log(`\n📋 Processing table: ${tableName}`);

    // Get table schema
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

    // Create DROP TABLE statement
    allSQL.push(`\n-- Table: ${tableName}`);
    allSQL.push(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);

    // Create CREATE TABLE statement
    const columnDefs = columns.map(col => {
      let def = `"${col.name}" ${convertDataType(col.type)}`;
      if (col.notnull) def += ' NOT NULL';
      if (col.dflt_value !== null) {
        let defaultVal = col.dflt_value;
        // Handle SQLite-specific defaults
        if (defaultVal === 'CURRENT_TIMESTAMP') defaultVal = 'NOW()';
        def += ` DEFAULT ${defaultVal}`;
      }
      if (col.pk) def += ' PRIMARY KEY';
      return def;
    }).join(',\n    ');

    allSQL.push(`CREATE TABLE "${tableName}" (`);
    allSQL.push(`    ${columnDefs}`);
    allSQL.push(`);`);
    allSQL.push('');

    // Get table data
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`  ✅ ${rows.length} rows found`);

    if (rows.length > 0) {
      allSQL.push(`-- Data for ${tableName} (${rows.length} rows)`);
      
      // Get column names
      const columnNames = columns.map(c => `"${c.name}"`).join(', ');

      // Insert data
      for (const row of rows) {
        const values = columns.map(col => escapeValue(row[col.name])).join(', ');
        allSQL.push(`INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});`);
      }
      allSQL.push('');
    }
  }

  // All tables processed
  allSQL.push('\n-- Re-enable triggers');
  allSQL.push('SET session_replication_role = DEFAULT;');
  allSQL.push('\n-- Migration complete');
  allSQL.push(`-- Total tables: ${tables.length}`);
  allSQL.push(`-- Generated: ${new Date().toISOString()}`);

  // Write to file
  const outputFile = path.join(outputDir, 'migration.sql');
  fs.writeFileSync(outputFile, allSQL.join('\n'));
  
  console.log(`\n✅ Migration SQL generated successfully!`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`📊 Tables exported: ${tables.length}`);
  
  // Generate summary
  const summaryFile = path.join(outputDir, 'summary.txt');
  const summary = [
    'Migration Summary',
    '=================',
    '',
    `Date: ${new Date().toISOString()}`,
    `Source: SQLite (dev.db)`,
    `Target: PostgreSQL (Supabase)`,
    `Tables: ${tables.length}`,
    '',
    'Tables exported:',
    ...tables.map(t => `  - ${t.name}`)
  ].join('\n');
  
  fs.writeFileSync(summaryFile, summary);
  console.log(`📄 Summary: ${summaryFile}`);
  
  db.close();
  console.log(`\n🎉 Export complete!`);
  
} catch (err) {
  console.error('Error during export:', err.message);
  console.error(err.stack);
  db.close();
  process.exit(1);
}
