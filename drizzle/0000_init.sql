CREATE TYPE "public"."place_status" AS ENUM('ACTIVE', 'INACTIVE', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'VILLAGE');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('NEW_PLACE', 'WRONG_PHONE', 'WRONG_HOURS', 'WRONG_LOCATION', 'CLOSED', 'OTHER');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"location_url" text,
	"phone" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"village_id" integer,
	"pinned" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"author_id" text,
	"search_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"username" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"summary" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sector_id" text NOT NULL,
	"village_id" integer,
	"phones" text[] DEFAULT '{}' NOT NULL,
	"opening_hours" text,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"location_url" text,
	"description" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"website" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"status" "place_status" DEFAULT 'ACTIVE' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'LayoutGrid' NOT NULL,
	"color" text DEFAULT '#64748B' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"from_slug" text PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "submission_type" NOT NULL,
	"place_id" text,
	"name" text,
	"sector_id" text,
	"phone" text,
	"address" text,
	"content" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"contact_name" text,
	"contact_phone" text,
	"status" "submission_status" DEFAULT 'PENDING' NOT NULL,
	"handled_by_id" text,
	"handled_at" timestamp with time zone,
	"handler_note" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'VILLAGE' NOT NULL,
	"village_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"merged_from" text,
	"area_ha" double precision,
	"population" integer,
	"households" integer,
	"secretary_name" text,
	"secretary_phone" text,
	"leader_name" text,
	"leader_phone" text,
	"front_head_name" text,
	"front_head_phone" text,
	"note" text,
	"location_url" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"polygon" jsonb,
	"search_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villages_code_unique" UNIQUE("code"),
	CONSTRAINT "villages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_events" ADD CONSTRAINT "place_events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_place_idx" ON "place_events" USING btree ("place_id","type");--> statement-breakpoint
CREATE INDEX "events_time_idx" ON "place_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "places_sector_idx" ON "places" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "places_village_idx" ON "places" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");