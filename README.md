# Entertainment Hub — Backend

Standalone backend for the Entertainment Hub's 10 AI features. Built to plug into the
main app later, but works independently for MVP testing.

## Setup

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Required Supabase tables (run in SQL editor)

You need `profiles`, `photos`, and `entertainment_results` tables — see the full
`backend-spec.md` from earlier for the complete schema + RLS policies. Minimum needed
for this service to run:

```sql
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  cloudinary_public_id text not null,
  cloudinary_url text not null,
  uploaded_at timestamptz default now()
);

alter table photos enable row level security;
create policy "Users manage own photos" on photos
  for all using (auth.uid() = user_id);

create table entertainment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  photo_id uuid references photos(id) on delete cascade,
  feature text not null,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table entertainment_results enable row level security;
create policy "Users manage own entertainment" on entertainment_results
  for all using (auth.uid() = user_id);
```

## Launch mode: everything free right now

`src/config/plan.config.js` has `LAUNCH_MODE_ALL_FREE = true` — every feature is
unlocked for every user regardless of plan, exactly as requested for launch.

When you're ready to start charging:
1. Set `LAUNCH_MODE_ALL_FREE = false`
2. Edit the `FREE_FEATURES` array in the same file to whichever features should
   stay free (e.g. `funny_friend`, `meme_generator`, `emoji_viral`, `ai_judge`)
3. No other code changes needed — `plan.middleware.js` already reads from this config
   and will start enforcing `plan === 'basic'` for everything else.

## Features (10 engines, all sub-features included)

| Engine | Sub-features returned |
|---|---|
| `funny_friend` | funny_review, friendly_joke, nickname, funny_story, friend_reaction |
| `savage_roast` | light_roast, savage_roast, roast_battle_line, roast_meter |
| `flirty_ai` | boy_rizz_line, girl_rizz_line, pickup_lines, cute_compliments, dm_suggestion |
| `bollywood` | hero_rating, villain_aura, movie_title, bollywood_dialogue |
| `standup_comedy` | comedy_review, one_liners, storytelling_bit |
| `meme_generator` | meme_caption, meme_template_suggestion, gif_caption, viral_meme_idea |
| `instagram_comments` | cool_comments, funny_comments, flirty_comments, roast_comments |
| `ai_judge` | verdict, scores (style/vibe/originality), judge_comment |
| `challenge` | challenge_title, challenge_description, difficulty |
| `emoji_viral` | emoji_review, emoji_story, viral_comment, viral_reel_caption, youtube_shorts_hook |

## API

```
POST /api/photos/upload
Headers: Authorization: Bearer <supabase_access_token>
Body: multipart/form-data, field name "photo"
→ Uploads to Cloudinary, saves a row in `photos`, returns { id, cloudinary_url }
  This is the photoId the frontend then passes to every engine call below.

POST /api/entertainment/:feature
Headers: Authorization: Bearer <supabase_access_token>
Body: { "photoId": "uuid-of-uploaded-photo" }
→ "Generate Again" on frontend = call this same endpoint again with the same photoId.

GET /api/entertainment/history/all
Headers: Authorization: Bearer <supabase_access_token>
→ Full history for the Progress/History pages.

GET /api/entertainment/dashboard
Headers: Authorization: Bearer <supabase_access_token>
→ Powers the Entertainment Dashboard: overall_entertainment_score (auto-averaged
  from numeric fields like roast_meter, hero_rating, judge scores), total_generations,
  feature_usage counts, and the 10 most recent results.
```

`Share Button` is a frontend-only action (Web Share API or copy-to-clipboard on a
result's text) — no backend endpoint needed.

## Content safety note — please read before editing prompts

All prompts (`src/prompts/entertainment.prompts.js`) explicitly instruct Gemini to
avoid sexual/suggestive content. This is intentional and stays in place even for the
Instagram Comment Engine's "flirty" comments (wholesome compliments only, no innuendo).

Reason: the app currently has no real age-verification system (just email/OTP or
Google sign-in), and photos belong to real, potentially underage users. Labeling a
feature "18+" in the UI does not verify anyone's actual age, so it doesn't remove the
risk — don't add sexual/innuendo content generation without first building genuine
age verification (e.g. ID/document verification), and even then, treat it as a
separate, clearly-gated product surface.

## Folder structure

```
entertainment-backend/
├── server.js
├── package.json
├── .env.example
└── src/
    ├── app.js
    ├── config/
    │   ├── gemini.js
    │   ├── supabase.js
    │   ├── cloudinary.js
    │   └── plan.config.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   └── plan.middleware.js
    ├── prompts/
    │   └── entertainment.prompts.js
    ├── services/
    │   └── gemini.service.js
    ├── controllers/
    │   ├── entertainment.controller.js
    │   └── photos.controller.js
    └── routes/
        ├── entertainment.routes.js
        └── photos.routes.js
```
