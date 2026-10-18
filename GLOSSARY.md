# D&D session tools

Web tools one D&D group uses between games: each player answers questions about their character, and the DM reads the answers.

## Groups and players

**Group**:
One play group, identified by a short code. Every tool (Session Zero, One, Two) reads the same group.
_Avoid_: session (a session is one tool's questionnaire), room

**Character**:
One of the premade player characters (deq, tenni, bebby, vilhelm, turator). Each character can be held by one player per group at a time.
_Avoid_: hero, PC (in code and content)

**Secret**:
The `### secret` part of a character's info step. Only the player holding that character, and the DM, receive it.
_Avoid_: private lore

## Session Two

**Subclass** (תת-מקצוע):
The level-3 specialisation of a class: a paladin oath, barbarian path, cleric domain, rogue subclass or wizard school. Only the four 2024 PHB subclasses per class are offered.
_Avoid_: archetype, specialization

**Carried answer**:
A Session One answer that Session Two uses: the answer given by the Session One player of the same character in the same group. Read live, never copied. A player who chose "switch" in Session One carries nothing.
_Avoid_: imported, migrated

**Background override**:
The `background:` front-matter line of a Session Two character file, set by the DM. It beats every answer, and the player is not asked.
_Avoid_: default background

**Effective answer**:
The answer Session Two acts on for a step: the background override, else the carried answer, else the Session Two answer.

**Custom background**:
A background that is no option of the Session One `background` step and is covered by one character's own steps (Vilhelm's Mharoti scholar-criminal).

**Details step**:
The follow-up step about the background: `details_<background id>`, or `details_other` for any other background.
_Avoid_: specifics

**Characteristics**:
The four steps `trait`, `ideal`, `bond`, `flaw` that follow the details step.

**Context line**:
A read-only line above a step's options that shows an earlier answer.
_Avoid_: hint (a step hint is static text)

**Shared step**:
A step in `content/session-two/steps/`. Every character gets it.
_Avoid_: list (a list holds options, not steps)
