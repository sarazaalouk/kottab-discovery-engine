# Sources

The sources below follow the challenge's official reference pack, **"المرجعية والحزمة العلمية"** (Islamic AI Challenge 2026). The model never writes Quran text or meanings; everything the child or parent reads comes from these sources through the approved cards.

## 1. Quran text

| | |
|---|---|
| File | `data/quran_fatiha.json` (Surah Al-Fatiha, 7 ayahs, Hafs numbering: the Basmala is ayah 1) |
| Current source | quran.com — Uthmani text, Hafs |
| Verified | Checked letter by letter against a printed Mushaf by Sara Zaalouk on 2026-10-04 |
| Reference-pack source | مصحف المدينة النبوية، مجمع الملك فهد لطباعة المصحف الشريف، رواية حفص (النص الرقمي للمطورين) |
| Status of the match | **Pending.** On 2026-10-05 the King Fahd Complex developer site (qurancomplex.gov.sa/quran-dev) could not be reached, so the source was left unchanged. Recorded in `kfgqpc_match` inside the file. |

## 2. Al-Tafsir Al-Muyassar — first source for word definitions

| | |
|---|---|
| Source | التفسير الميسر، مجمع الملك فهد لطباعة المصحف الشريف |
| Transcribed from | quran.com (kept in each card's `source_url`) |
| Cards | kb-017 to kb-021 |
| Role | First source for what a word means (it is on the challenge's approved list) |

## 3. Tafsir Ibn Kathir — depth and context (tafsir bil-ma'thur)

| | |
|---|---|
| Edition | تفسير القرآن العظيم، ابن كثير، تحقيق سامي سلامة، دار طيبة، الطبعة الثانية 1420هـ (1999م)، نسخة المكتبة الشاملة shamela.ws (book 8473) |
| Cards | 64 cards (every card whose `source` is تفسير ابن كثير) |
| Page references | `page_ref` on each card (volume and page of the printed edition) |

How the page references were found (2026-10-05): the main text (without footnotes) of Shamela pages 85–156 of volume 1 was read, and each card's `meaning_ar` was searched for, letters only, ignoring vowel marks, punctuation and honorifics (Shamela shows ﷺ and similar as symbols). A page is recorded only when every quoted part of the card was found in full.

- 61 of 64 cards: found in full; page recorded.
- 3 cards: **not** found word for word, so `page_ref` is "يُستكمل" and the text is waiting for Sara's decision:
  - kb-064 (ج1 ص143): the card has the word "فضلها" after "وهي سبع آيات"; the edition does not.
  - kb-066 (ج1 ص115): the card reads "والشيطان معناه في لغة العرب"; the edition reads "والشيطان في لغة العرب".
  - kb-067 (ج1 ص116): the card reads "والرجيم معناه : فعيل"; the edition reads "والرّجيم: فعيل".

## 4. Hadith grading

| | |
|---|---|
| Platform | الدرر السنية — dorar.net/hadith |
| Fields | `hadith_grade`, `grade_source_url`, `hadith_ref` on every card that quotes a hadith |
| Filled in by | Sara Zaalouk (empty until then; the reviewer page shows "لم يُعبَّأ بعد") |
| Cards | kb-001, kb-002, kb-004, kb-005, kb-006, kb-009, kb-010, kb-026, kb-029, kb-033, kb-038, kb-041, kb-042, kb-043, kb-051, kb-056, kb-062, kb-063, kb-068 |

## 5. English terminology

Used to check the English wording of Islamic terms in translations (see the terminology rule in `CLAUDE.md`):

- terminologyenc.com
- islamic-content.com/dictionary

## Where each source is shown

- **Child episode:** meaning cards show the card id and the source name.
- **Parent report:** a Sources section lists each card's source, location, edition and page, and the hadith grade when there is one.
- **Reviewer page:** each meaning is shown next to the source text (`meaning_ar`), its location and page, and the three hadith fields.
