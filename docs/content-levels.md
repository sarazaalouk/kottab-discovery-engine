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
- **ج and د — Questions.** The "Ask a question" box does not answer from the model. The model only decides whether one approved card answers the question; if not, or if it is unsure, the child sees a polite referral and the question is logged for the teacher.

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
