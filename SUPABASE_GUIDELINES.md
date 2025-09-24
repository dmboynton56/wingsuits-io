# Supabase Backend-as-a-Service (BaaS) Guidelines

This document defines how we use Supabase for authentication, database, and storage.

### 1. Core Responsibilities

-   **Authentication**: Handles all user sign-up, login (OAuth, email/password), and session management.
-   **Database (Postgres)**: Acts as our primary persistent data store for all non-real-time data.
-   **Storage (Optional)**: Can be used to store user-generated content like custom skins or profile pictures.

### 2. Database Schema

All tables should be created and managed via Supabase's migration files, not the UI, to ensure they are in version control.

**`profiles` table:**
(Extends the built-in `auth.users` table)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Foreign Key to `auth.users.id` |
| `username` | `text` | Unique, user-displayable name |
| `xp` | `integer` | Default 0 |
| `level` | `integer` | Default 1 |
| `highest_unlocked_biome` | `integer` | Default 1; gates access to world regions |
| `updated_at` | `timestampz` | Auto-updates on change |

**`wingsuits` table (static data):**
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `serial` | Primary Key |
| `name` | `text` | e.g., "Racer X", "Acrobat" |
| `speed_stat` | `integer` | |
| `maneuverability_stat` | `integer` | |
| `glide_stat` | `integer` | |
| `unlock_level` | `integer` | Level required to use |

**`leaderboards` table:**
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `bigserial` | Primary Key |
| `user_id` | `uuid` | Foreign Key to `profiles.id` |
| `race_seed` | `text` | The seed of the world the race was on |
| `finish_time_ms` | `integer` | Race time in milliseconds |
| `created_at` | `timestampz` | |

### 3. Row Level Security (RLS)

**RLS is mandatory for all tables containing user-specific or sensitive data.**

-   **`profiles` Policies:**
    -   Users can only `SELECT` and `UPDATE` their own profile (`auth.uid() = id`).
-   **`leaderboards` Policies:**
    -   All authenticated users can `SELECT` from the table.
    -   A user can only `INSERT` a row where the `user_id` matches their own ID (`auth.uid() = user_id`).
    -   `UPDATE` and `DELETE` should be highly restricted or disabled entirely.
-   **`wingsuits` (Static Data) Policies:**
    -   RLS should be enabled.
    -   A simple policy allowing any **authenticated user** to `SELECT` is sufficient, as this is game definition data. `INSERT`, `UPDATE`, and `DELETE` should be disallowed for users.

### 4. Database Migrations

To keep the database schema version-controlled and reproducible, all changes must be made via Supabase migration files.

-   **Naming Convention:** Migrations should be named using a timestamp prefix followed by a short, descriptive name.
    -   Format: `YYYYMMDDHHMMSS_description.sql`
    -   Example: `20250924153000_create_leaderboards_table.sql`
-   **Process:** Use the Supabase CLI (`supabase db diff` and `supabase migration new`) to generate and manage migration files locally before applying them to the staging or production environments.