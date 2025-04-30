require("dotenv").config({ path: require('path').resolve(__dirname, '../.env.local') });

console.log("Loaded env:");
console.log("  NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("  SUPABASE_SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const serviceAccount = require("./our-stage-eugene-firebase-adminsdk-fbsvc-06c2558920.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

// Initialize Supabase (use service role key for full access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  // CLEAN SLATE: Delete all data from relevant tables before migration
  console.log("Cleaning up tables for a clean slate migration...");
  await supabase.from("event_dates").delete().neq("id", 0);
  await supabase.from("event_actors").delete().neq("id", 0); // if present
  await supabase.from("events").delete().neq("id", 0);
  await supabase.from("venues").delete().neq("id", 0);
  // Optionally: await supabase.from("news_articles").delete().neq("id", 0);
  // Optionally: await supabase.from("news_references").delete().neq("id", 0);
  console.log("All relevant tables cleaned!");
  console.log("Migrating Venues...");
  // 1. Extract unique venues from events
  const eventsSnap = await firestore.collection("events").get();
  const uniqueVenues = new Set();
  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    if (data.venue && typeof data.venue === 'string') {
      uniqueVenues.add(data.venue.trim());
    }
  }
  // Insert unique venues into Supabase and build mapping
  const venueNameToId = {};
  const eventIdMap = {};
  for (const venueName of uniqueVenues) {
    const { data: inserted, error } = await supabase
      .from("venues")
      .insert([{ name: venueName }])
      .select();
    if (error) {
      console.error("Supabase error inserting venue:", error, "Venue:", venueName);
      throw error;
    }
    venueNameToId[venueName.toLowerCase()] = inserted[0].id;
  }
  console.log('--- venueNameToId mapping ---');
  console.log(venueNameToId);

  // 2. Migrate Events
  console.log("Migrating Events...");
  for (const doc of eventsSnap.docs) {
    console.log('Processing event doc:', doc.id, doc.data());
    const data = doc.data();

    // Map venue name to venueId using venueNameToId
    let venue_id = null;
    if (data.venue) {
      const venueName = data.venue.trim().toLowerCase();
      console.log('Looking up event venue name:', data.venue, 'as', venueName);
      venue_id = venueNameToId[venueName] || null;
      if (!venue_id) {
        console.warn('No matching venue found for:', data.venue);
      }
    }

    // Prepare event insert payload (without date)
    const eventInsertPayload = {
      title: data.title,
      description: data.description || null,
      director: data.director || null,
      slug: data.slug || null,
      ticket_link: data.ticketLink || null,
      venue_id: venue_id,
      category: data.category || null,
    };
    console.log('Event insert payload:', eventInsertPayload, 'venue:', data.venue, 'mapped venue_id:', venue_id);

    const { data: inserted, error } = await supabase
      .from("events")
      .insert([eventInsertPayload])
      .select();
    console.log('Inserted:', inserted, 'Error:', error);
    if (error) {
      console.error('Supabase error inserting event:', error, 'Data:', data);
      continue; // Skip to next event
    }
    if (!inserted || !inserted[0] || !inserted[0].id) {
      console.error('No ID returned for inserted event, skipping. Data:', data);
      continue;
    }
    const eventPgId = inserted[0].id;
    eventIdMap[doc.id] = eventPgId;

    // Insert event dates into event_dates table
    if (Array.isArray(data.dates)) {
      for (const dateObj of data.dates) {
        const { date, time, isMatinee } = dateObj;
        const { error: dateError } = await supabase
          .from("event_dates")
          .insert([{
            event_id: eventPgId,
            date: date,
            time: time || null,
            is_matinee: typeof isMatinee === 'boolean' ? isMatinee : false,
          }]);
        if (dateError) {
          console.error('Supabase error inserting event_date:', dateError, 'Event:', data.title, 'Date:', dateObj);
        }
      }
    }

    // Insert event_actors relationships
    if (Array.isArray(data.actorIds)) {
      for (const actorFirebaseId of data.actorIds) {
        const actorPgId = actorIdMap[actorFirebaseId];
        if (actorPgId) {
          const { error } = await supabase
            .from("event_actors")
            .insert([{ event_id: eventPgId, actor_id: actorPgId }]);
          if (error) throw error;
        }
      }
    }
  }

    // 4. Migrate News Articles and References
  console.log("Migrating News Articles...");
  const newsSnap = await firestore.collection("news_articles").get();
  for (const doc of newsSnap.docs) {
    const data = doc.data();
    const { data: inserted, error } = await supabase
      .from("news_articles")
      .insert([
        {
          title: data.title,
          content: data.content || null,
          published_at: data.published_at ? new Date(data.published_at) : null,
        },
      ])
      .select();
    if (error) throw error;
    const newsId = inserted[0].id;

    // Insert news_references
    if (Array.isArray(data.references)) {
      for (const ref of data.references) {
        let refPgId = null;
        if (ref.type === "actor") refPgId = actorIdMap[ref.id];
        if (ref.type === "event") refPgId = eventIdMap[ref.id];
        if (ref.type === "venue") refPgId = venueIdMap[ref.id];
        if (refPgId) {
          const { error } = await supabase
            .from("news_references")
            .insert([{ news_id: newsId, ref_type: ref.type, ref_id: refPgId }]);
          if (error) throw error;
        }
      }
    }
  }

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:");
  if (err instanceof Error) {
    console.error(err.stack || err.message);
  } else {
    console.error(JSON.stringify(err, null, 2));
  }
  process.exit(1);
});
