# Backend setup (Supabase)

The app works without this — it shows the sample restaurants in `data/`. Follow these steps to connect it to a real database.

## 1. Create a Supabase project (you do this — about 5 minutes)

1. Sign up at **supabase.com** (free plan is fine).
2. Click **New project**. Name it `allergy-app`, pick the **Canada (Central)** region, and save the database password somewhere safe (a password manager).
3. Wait a minute or two for it to finish setting up.

## 2. Create the tables

1. In the project, open **SQL Editor** → **New query**.
2. Paste everything from [`migrations/0001_initial_schema.sql`](migrations/0001_initial_schema.sql) and click **Run**.
3. New query again: paste [`seed.sql`](seed.sql) and click **Run**. This adds the 50 allergens and the 5 sample Vernon restaurants.
4. New query again: paste [`migrations/0002_delete_account.sql`](migrations/0002_delete_account.sql) and click **Run**. This lets people delete their own account from the app.

Any later file in `migrations/` gets run the same way, in number order.

## 3. Connect the app

1. In Supabase, go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In this folder's parent (the project root), copy `.env.example` to a new file called `.env.local` and paste the two values in.
3. Restart the app (`npx expo start`). The Find screen now loads restaurants from Supabase.

`.env.local` is ignored by git, so the keys don't go to GitHub. The anon key is designed to be used in apps; the security rules in the database decide what it can see. **Never** put the `service_role` key in the app.

## What's in the database

| Table | What it holds | Who can see / change it |
|---|---|---|
| `allergens` | The 50 allergens | Everyone can read |
| `restaurants` | Restaurant details; `is_listed` = paid listing active | Everyone reads listed ones; owners edit their own; only admin/payment can set `is_listed` |
| `restaurant_allergens` | Which allergens each restaurant accommodates | Everyone reads; owners manage their own |
| `diner_profiles` | Family allergy profiles per account | Only the account owner |
| `reports` | "Report a problem" submissions | Sender and the restaurant's owner |
| `custom_allergen_counts` (view) | Most-requested allergens that aren't on the list | Dashboard only |

## Before launch

- Delete sample restaurants: `delete from public.restaurants where is_sample;`
- Have the allergen list reviewed by a dietitian or allergist.

## Assumptions to revisit

- Accommodation is stored **per restaurant**. Per-dish would add a `dishes` table.
- Restaurants that only partly match are **hidden** in the app.
