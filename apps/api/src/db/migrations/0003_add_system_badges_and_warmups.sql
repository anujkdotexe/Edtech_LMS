CREATE TABLE IF NOT EXISTS "system_badges" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) DEFAULT 'Award' NOT NULL,
	"criteria_type" varchar(50) DEFAULT 'ACTION' NOT NULL,
	"criteria_threshold" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_warmup_challenges" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"language" varchar(50) NOT NULL,
	"prompt" text NOT NULL,
	"options" text NOT NULL,
	"correct_answer" varchar(255) NOT NULL,
	"xp_reward" integer DEFAULT 25 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
