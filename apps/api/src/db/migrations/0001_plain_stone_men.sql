ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'REFUNDED';--> statement-breakpoint
CREATE TABLE "daily_warmup_completions" (
	"user_id" uuid NOT NULL,
	"completed_date" date NOT NULL,
	"xp_awarded" integer DEFAULT 25 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_warmup_completions_user_id_completed_date_pk" PRIMARY KEY("user_id","completed_date")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_lesson" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "file_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "lesson_type" varchar(50) DEFAULT 'VIDEO' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "duration_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_free_preview" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN "correct_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN "total_questions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "daily_warmup_completions" ADD CONSTRAINT "daily_warmup_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lesson_completions_user_lesson" ON "lesson_completions" USING btree ("user_id","lesson_id");