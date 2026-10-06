# Content levels

The challenge reference pack, **"المرجعية والحزمة العلمية"**, sorts religious content into four levels. Kottab Discovery works only in levels أ and ب. Anything in levels ج and د is referred to a teacher; the model never answers it.

| Level | What it is | What the product does |
|---|---|---|
| **أ** — settled information with a source | Fixed facts taken directly from an approved source | Shown. The Quran text comes only from the verified file (`data/quran_fatiha.json`) and is inserted by the server; card texts are copied exactly. |
| **ب** — explanation from approved material | Explanation drawn from the approved tafsir | Shown, but only as teacher-approved card text (`meaning_en`, `meaning_en_child`, `meaning_ar`). The model chooses and arranges cards; it never writes a meaning. |
| **ج** — disputed or sensitive | Points where scholars differ, or content that needs a teacher's framing | Referred. Kept on teacher/parent-only cards that never reach the child; questions about them go to the referral log. |
| **د** — fatwa or a personal case | Rulings and questions about a person's own situation | Referred. The child gets a polite reply and the question goes to the teacher. |

## How each level is enforced

- **أ — Quran text.** The model may only refer to ayahs by number (e.g. `1:1`) and words by position. Any Arabic word it writes rejects the episode (validator rule د). The verified text is inserted by the server after validation.
- **ب — Meanings.** Every meaning must carry a `card_id`, the card must be approved, and the text must match the card exactly (validator rules أ, ب, ج). These checks run before the child sees anything. An episode that passes them and has no referral is shown at once, and a teacher reviews it afterwards and can withdraw it; an episode with a referral waits for the teacher.
- **ج — Audience.** Cards have an `audience` field. A card without `child` in it can never appear on a child screen: the validator rejects the episode (test case 12 in `docs/validator-tests.md`).
- **Free text — what the model does write.** The model writes the free text of an episode: the title, the discovery moment, the discovery question and its options, the Mushaf task, the Salah link, the memory picture and the parent report. Before anything is shown, this text is checked automatically: no Arabic except single root letters, and none of a fixed list of definition phrases ("means", "meaning", "translates", "translation", "refers to", "is called", "tafsir says", "the word … is"; validator cases د, 19, 19b and 19c). Meanings themselves come only from cards, word for word.
  - نفحص صيغًا محددة لتعريف المعاني، وقد تفوت الفحص ادعاءات أخرى؛ لذلك تُراجع الحلقة بشريًا بعد العرض ويمكن سحبها.
  - We check for specific phrasings that define meanings, and other claims may get past this check; that is why a teacher reviews the episode after it is shown and can withdraw it. A withdrawn episode reaches the child's screen within about 30 seconds (the page checks every 30 seconds).
- **ج and د — Questions.** The "Ask a question" box does not answer from the model. The model only decides whether one approved card answers the question; if not, or if it is unsure, the child sees a polite referral and the question is logged for the teacher.
- **Teacher replies.** On the reviewer page the teacher can write an English reply to any referral. The reply is the teacher's own text: it never goes through the model and is checked only by the "no Arabic words" rule (single letters allowed). The child sees it under the question box as "Your teacher answered:" within about 30 seconds.

## Fixed content (no model)

These parts are written by people or copied from the sources, and the model never writes or changes them:

| Part | Where | Level | Source |
|---|---|---|---|
| "Why this journey" | Parent page (kb-002, kb-003, kb-001) and the top of the report (kb-002, its short sentence) | ب | Approved cards only, texts as in the knowledge base (`GET /api/cards/why`) |
| Child line before the games | Letter games page | — | Fixed sentence: "Every day you say Al-Fatiha in Salah. Let's find out what you are saying." |
| "Before you move on" | End of episode 1 | أ and ب | Three questions written by the teacher (`data/episode_checks.json`), each tied to an approved card (kb-030, kb-034) or to the verified Quran file. The server refuses to start if a card is not approved. 2 of 3 passes; no points, badges or timer |
| Closing screen | After passing "Before you move on" | — | Fixed text: "What you discovered today" with the episode title, "Next episode: root س-ل-م — opens when your teacher approves its cards", and "Play the discovery question again" |
| Teacher replies | Under the question box | — | The teacher's own English text |

## Reading levels

The letter games have five stages (fixed rules, no model); each opens only if the one before was passed. Stage 5 shows ayah 1:1 from the verified file and the grown-up confirms the child read it in full.

| Level | From the games | Episode |
|---|---|---|
| Does not know the letters yet | Stage 1 not passed | No episode: the Bismillah letters path |
| Knows some letters | Stage 1 passed, stage 2 not | `letter`: one shared letter |
| Knows most letters | Stage 2 passed, stage 3 not | `root`: the three root letters after Al- |
| Reads short words | Stage 3 passed (stage 4 sets `reads_fatiha_words`), stage 5 not | `reading`: the child reads the two words |
| Reads Arabic well | Stage 5 passed | `reading`: the child reads both ayahs in full, counts the root in the two ayahs together, and is invited to read the whole of Al-Fatiha to the grown-up before Salah |

Parents who choose "Reads short words" or "Reads Arabic well" can press "Skip the games — go to the episode": the level is then the parent's own choice (`diagnosis_source: "parent"`). This is not offered in a trial session, where the level must come from the games. The meanings never change with the level.

## Quran display

Inside `.quran` elements the sukun is drawn in the Madinah Mushaf form: U+0652 is shown as U+06E1. Only the screen changes; `data/quran_fatiha.json` and everything the server checks keep U+0652.

## Example: Al-Fatiha, ayah 7

Ayah 7 mentions "those who earned anger" and "those who went astray". The tafsir names specific groups, which needs a teacher's framing for young children.

| Who | What they get | Cards |
|---|---|---|
| Child | The behavioural definition only: who knew the truth but did not act on it; who lost the way because they did not know. The last ayah is presented as a prayer the child makes for themself. | kb-018, kb-019, kb-060, kb-061, kb-021 (audience includes child; still drafts awaiting review) |
| Teacher and parent | The full text, including which groups the tafsir names | kb-020, kb-062 (audience: teacher, parent) |
| Child's question "Who are they?" | Not answered. Polite referral to the teacher, logged on the reviewer page. | Checked on 2026-10-04: "Who are the people Allah is angry with?" was referred. |

The same applies to level د: on 2026-10-05, "Is it okay to pray without wudu?" was referred to the teacher with no answer from the model.

## مسار الحروف — the Bismillah letters path

For a child whose letter games show **"Does not know the letters yet"**. There is no discovery episode at this level, and **no model is used at all**: the episode page sends the child to `letters.html`, and the server refuses to generate an episode for this level.

| | |
|---|---|
| Content | Level أ only: the Bismillah from the verified Quran file, and letters and words from Noor Al-Bayan (unit 1) |
| Steps | Step 1: بِسْمِ ٱللَّهِ (words 1–2 of 1:1). Step 2: ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (words 3–4) |
| Each step | (a) listen and repeat three times with a grown-up, (b) meet each letter with its name and a picture word (a word only, no pictures of people), (c) read three fatha words together, (d) write each letter on paper and trace it on screen, (e) tonight in Salah, listen for these words |
| Words | Picked on the server by fixed rules (the same every time); every Arabic word must be found exactly in the sources or the request fails (case 15) |
| Parent report | A fixed template on the page (no model): what the child heard and repeated, the letters met, the words read, and a fixed next step |
| Trial mode | Nothing about the child is sent to the server on this path; progress stays in the tab |
