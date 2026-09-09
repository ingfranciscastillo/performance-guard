CREATE TABLE "notification_prefs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pref" text NOT NULL,
	"enabled" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_prefs_user_id_pref_unique" ON "notification_prefs" USING btree ("user_id","pref");