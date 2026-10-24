import { getDbPool } from "../src/lib/db";
import fs from "fs";

const pool = getDbPool();
const raw = JSON.parse(fs.readFileSync("data/calls_cache.json", "utf8"));

async function seed() {
  console.log("Seeding", raw.length, "recordings from cache...");
  for (let i = 0; i < raw.length; i += 50) {
    const chunk = raw.slice(i, i + 50);
    for (const c of chunk) {
      await pool.query(
        `
        INSERT INTO bch_plivo_recordings (
          recording_id, call_uuid, from_number, to_number, recording_url,
          recording_duration_ms, rounded_recording_duration, add_time, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (recording_id) DO UPDATE SET
          recording_duration_ms = EXCLUDED.recording_duration_ms,
          raw_data = EXCLUDED.raw_data;
        `,
        [
          c.recording_id,
          c.call_uuid || null,
          c.from_number || null,
          c.to_number || null,
          c.recording_url || null,
          parseFloat(c.recording_duration_ms || 0),
          parseFloat(c.rounded_recording_duration || 0),
          c.add_time || new Date().toISOString(),
          JSON.stringify(c),
        ]
      );
    }
    console.log(`Seeded up to ${Math.min(i + 50, raw.length)}`);
  }

  const countRes = await pool.query("SELECT count(*) FROM bch_plivo_recordings;");
  console.log("Done! Total in Supabase bch_plivo_recordings:", countRes.rows[0].count);
  await pool.end();
}

seed().catch(console.error);
