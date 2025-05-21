import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function migrateEventDates() {
  console.log('Starting event dates migration...');
  
  // 1. Get all events
  console.log('Fetching all events...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, slug');
  
  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    process.exit(1);
  }
  
  console.log(`Found ${events.length} events to process.`);
  
  // 2. Process each event
  for (const event of events) {
    console.log(`Processing event: ${event.title} (ID: ${event.id})`);
    
    // 3. Get all dates for this event
    const { data: dates, error: datesError } = await supabase
      .from('event_dates')
      .select('*')
      .eq('event_id', event.id);
    
    if (datesError) {
      console.error(`Error fetching dates for event ${event.id}:`, datesError);
      continue;
    }
    
    if (!dates || dates.length === 0) {
      console.log(`No dates found for event ${event.title} (ID: ${event.id})`);
      continue;
    }
    
    // 4. Format dates as JSONB array
    const formattedDates = dates.map(d => ({
      date: d.date,
      mainTime: d.time,
      isMatinee: d.is_matinee || false,
      matineeTime: d.matinee_time || null
    }));
    
    // 5. Update the event with the new dates JSONB
    console.log(`Updating event ${event.id} with ${formattedDates.length} dates`);
    const { error: updateError } = await supabase
      .from('events')
      .update({ dates: formattedDates })
      .eq('id', event.id);
    
    if (updateError) {
      console.error(`Error updating event ${event.id}:`, updateError);
      continue;
    }
    
    console.log(`✅ Successfully migrated dates for event: ${event.title}`);
  }
  
  console.log('Migration complete!');
}

// Execute the migration
migrateEventDates().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
