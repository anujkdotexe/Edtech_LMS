ALTER TYPE "public"."user_role" ADD VALUE 'INSTRUCTOR' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;