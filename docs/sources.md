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

- All 64 cards now match the edition; every card has a page.
- 61 cards matched on the first check.
- 3 cards had one extra word that is not in the edition. On Sara's decision (2026-10-05) the word was removed so the text matches the Dar Taybah edition, which is now the reference. Each of these cards records the correction, its date and the previous text in `text_corrected`:
  - kb-064 (ج1 ص143): removed "فضلها" after "وهي سبع آيات".
  - kb-066 (ج1 ص115): removed "معناه" in "والشيطان معناه في لغة العرب".
  - kb-067 (ج1 ص116): removed "معناه" in "والرجيم معناه : فعيل".

The original import file `data/kb_cards_import.md` is kept unchanged as the record of what was first entered.

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

## 6. Noor Al-Bayan — letter games and the Bismillah letters path

| | |
|---|---|
| Book | نور البيان لتعليم القراءة وترتيل القرآن — محمد حسن محمد (طارق السعيد) |
| Edition | The scanned edition Sara uploaded; page numbers follow the book's own numbering; words copied as printed, with the book's vowel marks |
| File | `data/noor_albayan.json` (unit 1: the letters, fatha lessons 1–10, samples of kasra and damma) |
| Used by | Letter games stage 3, and the Bismillah letters path (`letters.html`) — fixed content, no model |
| Check | Every Arabic word the letters path serves must be found exactly in this file or in `data/quran_fatiha.json`; otherwise the server refuses (case 15 in `docs/validator-tests.md`) |

Words and pages used (picked by fixed rules in `lib/noor.js`):

- **Letter games, stage 3:** حَبَسَ، مَسَحَ (الفتح 6، ص8)، هَمَسَ (الفتح 8، ص10) — the first three fatha words made only of Basmala letters.
- **Letters path, step 1 (بِسْمِ ٱللَّهِ):** picture words بَيت (ص3)، سَمَكة (ص4)، مَوز (ص5)، أَقصى (ص3)، لَيمون (ص5)، هَرَم (ص5); reading words سَأَلَ، جَلَسَ، حَبَسَ (الفتح 6، ص8).
- **Letters path, step 2 (ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ):** picture words أَقصى (ص3)، لَيمون (ص5)، رَغيف (ص4)، حَمامة (ص3)، مَوز (ص5)، نَخلة (ص5)، يَد (ص5); reading words أَمَرَ، طَحَنَ، مَسَحَ (الفتح 6، ص8).
- Alif (ا) uses the book's picture word for أ (أَقصى), as the book does in its first lesson.
- The Bismillah text itself always comes from `data/quran_fatiha.json` (1:1).
