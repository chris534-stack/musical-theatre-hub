-- Supabase/Postgres schema for Eugene theatre app

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    capacity INT
);

CREATE TABLE actors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP,
    venue_id INT REFERENCES venues(id) ON DELETE SET NULL
);

CREATE INDEX idx_events_venue_id ON events(venue_id);

CREATE TABLE event_actors (
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    actor_id INT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, actor_id)
);

CREATE INDEX idx_event_actors_event_id ON event_actors(event_id);
CREATE INDEX idx_event_actors_actor_id ON event_actors(actor_id);

CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    published_at TIMESTAMP
);

CREATE TABLE news_references (
    news_id INT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    ref_type TEXT NOT NULL CHECK (ref_type IN ('actor', 'event', 'venue')),
    ref_id INT NOT NULL,
    PRIMARY KEY (news_id, ref_type, ref_id)
);

CREATE INDEX idx_news_references_news_id ON news_references(news_id);
CREATE INDEX idx_news_references_ref_type_ref_id ON news_references(ref_type, ref_id);
