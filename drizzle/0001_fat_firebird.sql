ALTER TYPE "public"."problem_source" ADD VALUE 'neetcode' BEFORE 'manual';--> statement-breakpoint
CREATE TABLE "neetcode_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "neetcode_credential" ADD CONSTRAINT "neetcode_credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "neetcode_credential_user_idx" ON "neetcode_credential" USING btree ("user_id");