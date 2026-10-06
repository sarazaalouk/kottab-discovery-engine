# Trial mode — sessions with real children

Rule (CLAUDE.md, privacy): in any trial with a real child, the parent agrees first, the profile sent to the model is synthetic, nothing is stored, and the teacher's notes go in a separate memo with no identifying data.

## How the app enforces it

What parents read: "We do not write trial data to disk; it is held briefly in server memory and erased when the session ends."

| What | Demo mode | Trial mode |
|---|---|---|
| Start | Parent profile form | Parent gate, then "Start a trial session" with a consent checkbox (required) |
| Name sent to the model | Whatever the parent typed (demo data) | A pseudonym only: Child A to Child E. The server refuses any other name. |
| Age | Exact age 6–10 | Approximate: "6 to 7" (sent as 7) or "8 to 10" (sent as 9) |
| Surahs known | Sent | Not collected; sent as "not shared" |
| Reading level | Letter games (five stages), the parent's guess, or "Skip the games" for the two reading levels | Letter games only (fixed rules, no model); "Skip the games" is not offered |
| Browser storage | `localStorage` | `sessionStorage` only (this tab), cleared when the session ends |
| Episode on the server | File in `data/episodes/` | Memory only, never written to disk |
| Referrals (child questions) | `data/referrals.jsonl` | Memory only, attached to the trial episode |
| Teacher replies to referrals | Stored with the referral in `data/referrals.jsonl` | Memory only, with the referral; erased when the session ends (`tests/replies-tests.js`, Y8) |
| "Review with a grown-up" result | `localStorage` (`episode_1_review`: passed or retry) | `sessionStorage` only; erased when the session ends. Nothing is sent to the server |
| Teacher review | Automatic check before the child sees the episode; teacher reviews after it is shown and can withdraw it; episodes with a referral wait for the teacher | Same; trial episodes are marked "جلسة تجربة" on the reviewer page |
| End | — | "End session" in the amber bar on every page erases the episode and its referrals on the server, then everything in the tab |
| Safety net | — | The server forgets trial episodes after 3 hours, or when it restarts |
| Session id | — | The browser makes a `trial_session_id` when the trial starts, before anything is generated, and sends it with every generation and question. The server attaches it to every trial episode and referral |
| A generation still running at "End session" | — | "End session" sends the session id; the server marks it as ended, erases everything that carries it, and drops any later save or referral with it, even when the episode id never reached the browser (`tests/trial-tests.js`, T7–T10) |
| "Erased" message | — | Shown only after the server confirms; if the request fails, the bar says "Not erased yet" and the tab keeps its data so the parent can try again |

The episode request still goes to the model provider's API; it contains only the fields above.

## Checked on 2026-10-05

A full trial session (Child B, 8 to 10): gate → consent → letter games → episode generated → approved on the reviewer page → child question referred → End session. (This check was run on 2026-10-05, before episodes were published automatically. Today an episode without referrals is shown right after the automatic check, and the teacher reviews it afterwards and can withdraw it.)

- Files in `data/episodes/` before and after: 4 and 4. Lines in `data/referrals.jsonl`: 1 and 1. The trial question was not written to disk.
- After "End session": the episode returns 404, no trial referrals remain, the tab's session storage is empty, and the page shows "The trial session has ended. Everything from it was erased."
- A trial request with a real-looking name ("Yusuf") is refused by the server.

## Teacher's note template (kept outside the app, no identifying data)

```
Date: ____________        Session: Child __ (A–E)        Age band: 6–7 / 8–10
Parent/guardian agreement given: yes / no

Letter games: easy / some difficulty / hard
Episode: did the child answer the discovery question by looking at the ayah?  yes / partly / no
Understood the meaning cards?  yes / partly / no
Memory picture helped?  yes / no / not used
Questions the child asked (no names, no family details):
-
What to change:
-
```
