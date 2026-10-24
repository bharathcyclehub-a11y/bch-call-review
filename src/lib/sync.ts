import { getDbPool } from "./db";

export async function syncNewPlivoRecordings(authId: string, authToken: string): Promise<number> {
  const pool = getDbPool();
  const authStr = `${authId}:${authToken}`;
  const base64Auth = Buffer.from(authStr).toString("base64");

  // Get currently known recording_ids
  const existingRes = await pool.query(
    "SELECT recording_id FROM bch_plivo_recordings ORDER BY add_time DESC LIMIT 200;"
  );
  const knownIds = new Set(existingRes.rows.map((r) => r.recording_id));

  let newCount = 0;
  let offset = 0;
  const limit = 20;

  // Paginate through Plivo recordings (up to 20 pages = 400 calls)
  for (let page = 0; page < 20; page++) {
    try {
      const res = await fetch(
        `https://api.plivo.com/v1/Account/${authId}/Recording/?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Basic ${base64Auth}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) break;
      const data = await res.json();
      const items: any[] = data.objects || [];
      if (items.length === 0) break;

      let pageNewCount = 0;
      for (const item of items) {
        if (!knownIds.has(item.recording_id)) {
          const insertRes = await pool.query(
            `
            INSERT INTO bch_plivo_recordings (
              recording_id, call_uuid, from_number, to_number, recording_url,
              recording_duration_ms, rounded_recording_duration, add_time, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (recording_id) DO NOTHING
            RETURNING recording_id;
            `,
            [
              item.recording_id,
              item.call_uuid || null,
              item.from_number || null,
              item.to_number || null,
              item.recording_url || null,
              parseFloat(item.recording_duration_ms || 0),
              parseFloat(item.rounded_recording_duration || 0),
              item.add_time || new Date().toISOString(),
              JSON.stringify(item),
            ]
          );
          if (insertRes.rowCount && insertRes.rowCount > 0) {
            newCount++;
            pageNewCount++;
            knownIds.add(item.recording_id);
          }
        }
      }

      // If an entire page had no new items or reached the end, we are caught up
      if (pageNewCount === 0 || items.length < limit) break;
      offset += limit;
    } catch (err) {
      console.error("Error during Plivo sync loop:", err);
      break;
    }
  }

  return newCount;
}

export async function getAllPlivoRecordingsFromDb(): Promise<any[]> {
  const pool = getDbPool();
  try {
    const res = await pool.query(
      "SELECT raw_data FROM bch_plivo_recordings ORDER BY add_time DESC;"
    );
    if (res.rows.length > 0) {
      return res.rows.map((r) => r.raw_data);
    }
  } catch (err) {
    console.error("Failed to read from bch_plivo_recordings:", err);
  }
  return [];
}
