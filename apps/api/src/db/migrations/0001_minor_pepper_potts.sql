CREATE TABLE "site_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;