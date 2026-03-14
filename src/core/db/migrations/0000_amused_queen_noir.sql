CREATE TABLE `downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`imdb_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`season` integer,
	`episode` integer,
	`episode_title` text,
	`poster_url` text,
	`stream_name` text,
	`stream_url` text NOT NULL,
	`direct_url` text,
	`local_path` text,
	`file_size` integer,
	`quality` text,
	`addon_id` text,
	`status` text NOT NULL,
	`progress` real DEFAULT 0,
	`downloaded_bytes` integer DEFAULT 0,
	`subtitle_path` text,
	`subtitle_lang` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `watch_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`imdb_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`season` integer,
	`episode` integer,
	`poster_url` text,
	`position_ms` integer DEFAULT 0,
	`duration_ms` integer DEFAULT 0,
	`is_offline` integer DEFAULT 0,
	`updated_at` integer NOT NULL
);
