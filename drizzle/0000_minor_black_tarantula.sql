CREATE TYPE "public"."difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
CREATE TYPE "public"."problem_source" AS ENUM('leetcode', 'manual');--> statement-breakpoint
CREATE TYPE "public"."review_outcome" AS ENUM('pass', 'fail');--> statement-breakpoint
CREATE TYPE "public"."user_problem_status" AS ENUM('attempting', 'solved');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leetcode_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_enc" text NOT NULL,
	"csrf_enc" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"leetcode_frontend_id" text,
	"title" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"source" "problem_source" DEFAULT 'leetcode' NOT NULL,
	"is_paid_only" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_company" (
	"problem_id" text NOT NULL,
	"company_id" text NOT NULL,
	"frequency" integer,
	CONSTRAINT "problem_company_problem_id_company_id_pk" PRIMARY KEY("problem_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "problem_topic" (
	"problem_id" text NOT NULL,
	"topic_id" text NOT NULL,
	CONSTRAINT "problem_topic_problem_id_topic_id_pk" PRIMARY KEY("problem_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "review_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_problem_id" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome" "review_outcome" NOT NULL,
	"from_box" integer NOT NULL,
	"to_box" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solution" (
	"id" text PRIMARY KEY NOT NULL,
	"user_problem_id" text NOT NULL,
	"title" text NOT NULL,
	"language" text DEFAULT 'typescript' NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text NOT NULL,
	"stats_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_problem" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"status" "user_problem_status" DEFAULT 'attempting' NOT NULL,
	"solved_at" timestamp with time zone,
	"notes_md" text DEFAULT '' NOT NULL,
	"leitner_box" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp with time zone,
	"last_reviewed_at" timestamp with time zone,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_problem_tag" (
	"user_problem_id" text NOT NULL,
	"user_tag_id" text NOT NULL,
	CONSTRAINT "user_problem_tag_user_problem_id_user_tag_id_pk" PRIMARY KEY("user_problem_id","user_tag_id")
);
--> statement-breakpoint
CREATE TABLE "user_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leetcode_credential" ADD CONSTRAINT "leetcode_credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_company" ADD CONSTRAINT "problem_company_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_company" ADD CONSTRAINT "problem_company_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_topic" ADD CONSTRAINT "problem_topic_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_topic" ADD CONSTRAINT "problem_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_user_problem_id_user_problem_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution" ADD CONSTRAINT "solution_user_problem_id_user_problem_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem" ADD CONSTRAINT "user_problem_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem" ADD CONSTRAINT "user_problem_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_tag" ADD CONSTRAINT "user_problem_tag_user_problem_id_user_problem_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_tag" ADD CONSTRAINT "user_problem_tag_user_tag_id_user_tag_id_fk" FOREIGN KEY ("user_tag_id") REFERENCES "public"."user_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tag" ADD CONSTRAINT "user_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_slug_idx" ON "company" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "leetcode_credential_user_idx" ON "leetcode_credential" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_slug_idx" ON "problem" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "problem_company_company_idx" ON "problem_company" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "problem_topic_topic_idx" ON "problem_topic" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "review_log_user_problem_idx" ON "review_log" USING btree ("user_problem_id");--> statement-breakpoint
CREATE INDEX "review_log_reviewed_at_idx" ON "review_log" USING btree ("reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "solution_user_problem_idx" ON "solution" USING btree ("user_problem_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_slug_idx" ON "topic" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "user" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_problem_user_problem_idx" ON "user_problem" USING btree ("user_id","problem_id");--> statement-breakpoint
CREATE INDEX "user_problem_user_idx" ON "user_problem" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_problem_next_review_idx" ON "user_problem" USING btree ("next_review_at");--> statement-breakpoint
CREATE INDEX "user_problem_tag_tag_idx" ON "user_problem_tag" USING btree ("user_tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_tag_user_name_idx" ON "user_tag" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "user_tag_user_idx" ON "user_tag" USING btree ("user_id");