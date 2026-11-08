# OptionEats

A mobile app that helps people with lesser-known food allergies find restaurants that will accommodate them. It starts with Vernon, BC.

Most allergy apps only cover the "top 9" allergens. OptionEats has a list of 50 that focuses on the less common ones. It lets a whole table (family or friends) combine their allergies and shows which restaurants can handle all of them.

## Features

- **Family allergy profiles:** pick from 50 allergens or add your own, for everyone you eat with
- **Restaurant search:** combine the allergies of whoever's eating, then search by name or by distance from you
- **Close matches:** restaurants that handle some of the table's allergies, with the missing ones flagged
- **Restaurant pages:** what each restaurant accommodates, with warnings for allergies it hasn't listed
- **Report a problem:** flag a restaurant listing that's wrong
- **Accounts:** email sign-up and log-in, profiles synced to your account, and account deletion
- **Works offline:** without a backend it runs on sample data and saves everything on the device

## Tech stack

- **React Native + Expo** (Expo Router, file-based navigation), written in **TypeScript**
- **Supabase** for the database (Postgres with row-level security) and authentication
- AsyncStorage for on-device data, and expo-location for "near me" search

## Run it locally

```bash
npm install
npx expo start
```

Then open it in Expo Go, an iOS simulator, an Android emulator or a web browser.

The app runs without any setup on 5 sample (fictional) Vernon restaurants. To connect a real backend, copy `.env.example` to `.env.local` and follow [supabase/README.md](supabase/README.md).

## Project structure

```
app/          Screens (Expo Router): tabs, profile, restaurant and report pages
components/   Shared UI components
data/         Allergen list, sample restaurants, data hooks
store/        Auth and profile state
lib/          Supabase client
supabase/     Database migrations, seed data and setup guide
```
