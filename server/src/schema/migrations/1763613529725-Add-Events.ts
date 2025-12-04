import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Main "event" table
  await sql`
    CREATE TABLE "event" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "ownerId" uuid NOT NULL,
      "eventName" character varying NOT NULL DEFAULT 'Untitled Event',
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "eventThumbnailAssetId" uuid,
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "description" text NOT NULL DEFAULT '',
      "deletedAt" timestamp with time zone,
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "event_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "event_ownerId_fkey"
        FOREIGN KEY ("ownerId") REFERENCES "user" ("id")
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT "event_eventThumbnailAssetId_fkey"
        FOREIGN KEY ("eventThumbnailAssetId") REFERENCES "asset" ("id")
        ON UPDATE CASCADE ON DELETE SET NULL
    );
  `.execute(db);

  await sql`
    COMMENT ON COLUMN "event"."eventThumbnailAssetId"
    IS 'Asset ID to be used as thumbnail';
  `.execute(db);

  await sql`CREATE INDEX "event_ownerId_idx" ON "event" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "event_eventThumbnailAssetId_idx" ON "event" ("eventThumbnailAssetId");`.execute(db);
  await sql`CREATE INDEX "event_updateId_idx" ON "event" ("updateId");`.execute(db);

  // Audit table for deletes on "event"
  await sql`
    CREATE TABLE "events_audit" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "eventId" uuid NOT NULL,
      "userId" uuid NOT NULL,
      "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT "events_audit_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "events_audit_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "event" ("id")
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT "events_audit_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "user" ("id")
        ON UPDATE CASCADE ON DELETE CASCADE
    );
  `.execute(db);

  await sql`
    CREATE INDEX "IDX_events_audit_user_id" ON "events_audit" ("userId");
  `.execute(db);
  await sql`
    CREATE INDEX "IDX_events_audit_event_id" ON "events_audit" ("eventId");
  `.execute(db);
  await sql`
    CREATE INDEX "IDX_events_audit_deleted_at" ON "events_audit" ("deletedAt");
  `.execute(db);

  // Delete-audit function and trigger on "event"
  await sql`
    CREATE OR REPLACE FUNCTION public.event_delete_audit()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      INSERT INTO events_audit ("eventId", "userId")
      SELECT "id", "ownerId"
      FROM old;
      RETURN NULL;
    END
    $function$;
  `.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "event_delete_audit"
      AFTER DELETE ON "event"
      REFERENCING OLD TABLE AS old
      FOR EACH STATEMENT
      WHEN (pg_trigger_depth() = 0)
      EXECUTE FUNCTION public.event_delete_audit();
  `.execute(db);

  // Updated-at trigger on "event" (assumes updated_at() already exists)
  await sql`
    CREATE OR REPLACE TRIGGER "events_updatedAt"
      BEFORE UPDATE ON "event"
      FOR EACH ROW
      EXECUTE FUNCTION updated_at();
  `.execute(db);

  // Link albums to event
  // Keep nullable so ON DELETE SET NULL is valid and existing data doesn't break.
  await sql`
    ALTER TABLE "album"
      ADD COLUMN "eventId" uuid;
  `.execute(db);

  await sql`
    ALTER TABLE "album"
      ADD CONSTRAINT "album_eventId_fkey"
      FOREIGN KEY ("eventId")
      REFERENCES "event" ("id")
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  `.execute(db);

  await sql`
    CREATE INDEX "album_eventId_idx" ON "album" ("eventId");
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Unlink album from event
  await sql`DROP INDEX IF EXISTS "album_eventId_idx";`.execute(db);
  await sql`
    ALTER TABLE "album"
      DROP CONSTRAINT IF EXISTS "album_eventId_fkey";
  `.execute(db);
  await sql`
    ALTER TABLE "album"
      DROP COLUMN IF EXISTS "eventId";
  `.execute(db);

  // Drop triggers and function on event
  await sql`
    DROP TRIGGER IF EXISTS "events_updatedAt" ON "event";
  `.execute(db);
  await sql`
    DROP TRIGGER IF EXISTS "event_delete_audit" ON "event";
  `.execute(db);
  await sql`
    DROP FUNCTION IF EXISTS public.event_delete_audit();
  `.execute(db);

  // Drop audit table
  await sql`DROP TABLE IF EXISTS "events_audit";`.execute(db);

  // Drop main event table
  await sql`DROP TABLE IF EXISTS "event";`.execute(db);
}
