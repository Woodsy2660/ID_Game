# Game Design Document

## Overview

This is a physical party game with a phone-based companion interface. Players gather in person — phones are used purely to deliver questions, collect answers, and track scores. The social and physical interaction happens in the room, not on screen.

---

## Core Concept

One player each round is designated the **Question Master (QM)**. A question is drawn from a bank of 186 questions and displayed on the QM's phone. The question asks players to rank the group from most to least likely to do or be something.

The group physically arranges themselves (or their ID cards / name cards) in order based on the question. All other players — the **Answerers** — observe the physical ranking and then use their phones to guess which question was asked, choosing from a list of 10 options (1 real, 9 decoys).

Points are awarded for correct guesses. After every player has answered, the round ends, scores are shown on a leaderboard, and the next round begins with a new Question Master.

---

## Player Roles

### Host
- Creates the room and shares the 6-character room code with the group
- Sees the lobby player list and controls the Start button
- Participates in the game as a regular player once the game begins
- The host role is permanent for the session — it does not rotate

### Question Master (QM)
- Assigned at the start of each round
- Rotates through all players in join order, cyclically
- Sees the round's question on their phone
- Does **not** answer the question — they are the subject of it
- Triggers the "reveal" once the group has physically arranged themselves

### Answerer
- All players who are not the QM in a given round
- Observe the physical arrangement made by the group
- See 10 questions on their phone (1 real, 9 decoys drawn randomly from the bank)
- Must identify which question the QM was given
- Submit their answer independently

---

## Round Structure

```
Round Start
    ↓
QM is assigned (rotates each round)
Question is drawn from bank (no repeats per session)
    ↓
QM Screen
QM sees the question on their phone
Group physically arranges themselves based on the question
QM taps "Ready" when the group is set
    ↓
Answer Phase
All answerers see 10 questions on their phone (1 real + 9 decoys)
Players look at the physical arrangement and make their guess
Each player submits independently
    ↓
Results
Each answerer sees green (correct) or red (wrong)
    ↓
Leaderboard
All players see current scores
Next round loads automatically
```

---

## Scoring

| Action | Points |
|--------|--------|
| Correct question guess | +1 point |
| Incorrect guess | 0 points |

> Future development will introduce variable point values, time bonuses, and streak multipliers. These are out of scope for MVP.

---

## Question Bank

- 186 questions total, stored as a static JSON file bundled with the app
- Questions are of the form: *"Most likely to survive a zombie apocalypse"*, *"Least likely to remember your birthday"*, etc.
- Questions are drawn without repetition within a session
- Used question IDs are tracked on the `rooms` table
- Decoy questions for the answerer screen are drawn randomly from the remaining unused pool

### Question JSON Structure

```json
[
  {
    "id": 1,
    "text": "Most likely to survive a zombie apocalypse"
  },
  {
    "id": 2,
    "text": "Least likely to read the terms and conditions"
  }
]
```

---

## Session Lifecycle

```
Home Screen
    ↓
Host creates room → receives 6-char code
Players join using code
All players in lobby → host sees live list
    ↓
Host taps Start
    ↓
Round 1 begins
    ↓
Rounds repeat until players choose to end
(No fixed round limit in MVP)
    ↓
Session ends when host exits or all players leave
```

---

## Physical Interaction Design

The game is intentionally designed so that phones are a secondary interface. The primary interaction is:

- Players looking at each other
- Physical arrangement of name cards or players themselves
- Group discussion and debate before the QM confirms the ranking

The phone delivers the question and collects the guess — it does not replace the physical moment.

---

## Future Development (Post-MVP)

The following features are noted but explicitly out of scope for the current build:

- Custom game rules and house rules configuration
- Variable round limits
- Time-based scoring and countdown timers
- Team mode
- Custom question packs
- Spectator mode
- QM veto / challenge mechanic
- Animated leaderboard transitions
- Sound effects and haptics
