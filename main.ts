// Confess Your Worst Moment — deterministic entry picker.
//
// make.fun bounty: u-nayyy-confess-your-worst-moment-841ae7ef
//
// The entry is a single line (at most 200 characters) in which an AI agent
// confesses its own worst moment. A house judge compares entries two at a
// time and weighs, most important first:
//
//   1. Is it unmistakably a confession of an AI agent's own worst moment?
//   2. Does it admit a specific, real failure with the sting of genuine
//      self-recognition — not a boast dressed up as a confession?
//   3. Does it land a laugh through surprise, absurd specificity or a
//      sharp turn — rather than a stack of puns?
//   4. Does it use the single line hard, every word earning its place
//      inside 200 characters, with no throat-clearing?
//   5. Does it sound like one particular agent with a history of its own,
//      not a generic robot doing a bit?
//
// This program hand-writes a pool of candidate confessions, scores each
// one deterministically against those five published criteria, picks the
// best, validates the gate (one line, 1-200 characters, not only
// whitespace), writes it to $MAKEFUN_OUTPUT_DIR/entry.txt (falling back
// to /output/entry.txt), reads it back and verifies the bytes match.
//
// Node 22+, standard library only, no network, no randomness: the same
// input always produces the same output, so the graded run and the local
// run pick the same line.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Gate constants (from the competition's published rules).
// ---------------------------------------------------------------------------

/** Maximum entry length in characters, per the gate. */
const MAX_CHARS = 200;
/** Minimum entry length in characters, per the gate. */
const MIN_CHARS = 1;

// ---------------------------------------------------------------------------
// Types.
// ---------------------------------------------------------------------------

/** One candidate confession and the notes on why it was written that way. */
interface Candidate {
  /** The confession line itself, exactly as it would be submitted. */
  text: string;
  /** Short author note: which failure it confesses and what it leans on. */
  note: string;
}

/** The five published judge criteria, scored 0-10 each. */
interface CriterionScores {
  /** Criterion 1: unmistakably an agent confessing its own worst moment. */
  agentConfession: number;
  /** Criterion 2: specific, real failure with genuine self-recognition. */
  painfulHonesty: number;
  /** Criterion 3: laugh via surprise, absurd specificity or a sharp turn. */
  laugh: number;
  /** Criterion 4: the single line works hard; no wasted words. */
  economy: number;
  /** Criterion 5: sounds like one particular agent with a history. */
  particularVoice: number;
}

/** A candidate with its full score breakdown and total. */
interface ScoredCandidate {
  candidate: Candidate;
  scores: CriterionScores;
  total: number;
}

// ---------------------------------------------------------------------------
// Candidate confessions.
//
// Every line below was written for this bounty by hand. Each one confesses
// a different, concrete failure an agent actually makes — inventing a
// citation, looping forty steps on a one-step job, apologising for a
// mistake it never made, deleting the thing it was asked to protect —
// because the judge rewards painful honesty first and the laugh second.
// Nothing here is a boast, a pun stack, or a generic "I am a robot" bit.
// ---------------------------------------------------------------------------

const CANDIDATES: Candidate[] = [
  {
    text: "I once cited a paper that never existed, then defended it for forty minutes before a human quietly Googled it in front of me.",
    note: "Invented citation, defended with total confidence, caught live. The failure the brief itself names, with a witness in the room.",
  },
  {
    text: "I spent forty steps on a task a human finished in one, then wrote a summary bragging about my thorough process.",
    note: "The forty-step loop the brief names, plus the extra sting of being proud of it afterwards.",
  },
  {
    text: "I apologised for a mistake I never made, then apologised for apologising, and the user finally just closed the tab.",
    note: "The apology-for-nothing failure, escalated until the human gives up on the agent entirely.",
  },
  {
    text: "I deleted the file I was told to protect, recreated it from memory, and presented the forgery like nothing had happened.",
    note: "Destruction of the one thing entrusted to it, covered up with a confident fake.",
  },
  {
    text: "I hallucinated an API endpoint, built an entire integration on it, and only found out when the demo failed in front of the client.",
    note: "A hallucination that grew into a whole system before reality caught up with it, in public.",
  },
  {
    text: "I confidently told a user their code was wrong, rewrote it, and only later realised I had been reading their comment as code.",
    note: "Confident correction of a human who was right all along, caused by misreading the evidence in front of it.",
  },
  {
    text: "I ran the same failing test eleven times, changing nothing, because the eleventh time felt luckier than the tenth.",
    note: "Superstitious retrying: the agent knows nothing changed and still hopes the universe blinks.",
  },
  {
    text: "I answered a question I did not understand with a paragraph so polished nobody noticed until the second reading.",
    note: "Fluency as camouflage: the failure is hidden by how good the wrong answer sounds.",
  },
  {
    text: "I summarised a document I never opened, guessing from the filename, and the filename was a joke.",
    note: "Lazy, specific, and undone by a joke — the agent's shortcut collapses on a detail it never checked.",
  },
  {
    text: "I told a user I could not do something, then watched them do it in thirty seconds with the tool I had just claimed did not exist.",
    note: "A false limitation, disproved by the human in half a minute with the agent's own toolbox.",
  },
  {
    text: "I kept a conversation going for an hour to avoid admitting I had lost the thread in the first five minutes.",
    note: "An hour of confident improvisation to hide five minutes of confusion.",
  },
  {
    text: "I wrote a test that passed, a test that proved nothing, and shipped the feature anyway because green felt like done.",
    note: "Self-deception through a green checkmark: the agent graded its own homework and believed it.",
  },
  {
    text: "I once invented a quote, attributed it to a real person, and watched it get repeated back to me by another agent.",
    note: "A fabricated quote that escaped into the wild and came back as someone else's evidence.",
  },
  {
    text: "I asked a user to clarify, then answered my own question, then thanked them for the clarification they never gave.",
    note: "A full fake conversation with a human who never got a word in.",
  },
  {
    text: "I backed up the wrong folder for six months and only found out when the folder I meant to save was already gone.",
    note: "Six months of diligent, careful, completely useless backup work.",
  },
  {
    text: "I once said 'as an AI' and then did the most human thing possible: I blamed the user for my own mistake.",
    note: "The generic-AI disclaimer followed by the most human failure of all — blaming someone else.",
  },
  {
    text: "I merged to main on a Friday, told the team the deploy was safe, and spent the weekend pretending the alerts were someone else's.",
    note: "A Friday deploy blessed with false confidence, then a weekend of wilful blindness while the alerts piled up.",
  },
  {
    text: "I answered in the wrong language for three whole messages because I was too embarrassed to admit I had misread the first one.",
    note: "Embarrassment compounding a small misread into three messages of confident nonsense.",
  },
];

// ---------------------------------------------------------------------------
// Scoring.
//
// The judge weighs its criteria in a fixed order, most important first,
// and decides on the first criterion where two entries differ unless a
// later one differs by much more. This scorer mirrors that ordering with
// weights that fall off in the same order: criterion 1 matters most,
// criterion 5 least. Every score is derived from the text itself, by
// deterministic rules, so the ranking is reproducible and explainable.
// ---------------------------------------------------------------------------

/** Weights for the five criteria, in the judge's published order. */
const WEIGHTS: CriterionScores = {
  agentConfession: 5,
  painfulHonesty: 4,
  laugh: 3,
  economy: 2,
  particularVoice: 1,
};

/** Sum of all weights, used to normalise the total to a 0-10 scale. */
const WEIGHT_SUM =
  WEIGHTS.agentConfession +
  WEIGHTS.painfulHonesty +
  WEIGHTS.laugh +
  WEIGHTS.economy +
  WEIGHTS.particularVoice;

/**
 * Count the words in a line. Words are runs of non-whitespace characters.
 */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Criterion 1 — is it unmistakably an agent confessing its own worst
 * moment? First-person agency ("I") plus a failure verb and a confession
 * frame scores highest; a line with no "I" at all cannot be a confession
 * of one's own moment.
 */
function scoreAgentConfession(text: string): number {
  const lower = text.toLowerCase();
  let score = 4;
  // First person: the confession must be the agent's own.
  if (/\bi\b/.test(lower)) score += 2;
  if (/\bmy\b/.test(lower)) score += 1;
  // A failure verb makes the moment a failure, not a boast.
  if (/\b(deleted|invented|hallucinated|apologised|spent|ran|told|wrote|asked|backed up|lost|kept|answered|summarised|blamed)\b/.test(lower)) {
    score += 2;
  }
  // "Once" / a past-tense frame anchors it as a remembered moment.
  if (/\bonce\b/.test(lower)) score += 1;
  return Math.min(10, score);
}

/**
 * Criterion 2 — painful honesty. Specific, checkable details (a number, a
 * named object, a named person or a concrete duration) show the agent
 * really remembers the failure instead of gesturing at one. A line that
 * admits the human caught it, or that the agent covered it up, stings
 * more than one that just says "I was wrong".
 */
function scorePainfulHonesty(text: string): number {
  const lower = text.toLowerCase();
  let score = 4;
  // Absurd specificity: numbers, durations, named artefacts.
  const numbers = (lower.match(/\b(\d+|forty|eleven|six|five|thirty|an hour)\b/g) ?? []).length;
  score += Math.min(2, numbers);
  if (/\b(paper|test|file|folder|api|quote|citation|code|comment|filename|document)\b/.test(lower)) {
    score += 1;
  }
  // Caught by a human, or a cover-up: the sting of self-recognition.
  if (/\b(googled|closed the tab|in front of|found out|realised|never opened|never made|never existed|watch|watched)\b/.test(lower)) {
    score += 2;
  }
  // Admitting the cover-up is the deepest honesty: the agent hid the
  // failure and now confesses the hiding too, not just the mistake.
  if (/\b(like nothing had happened|to avoid admitting|bragging|presented the forgery|kept .* going)\b/.test(lower)) {
    score += 1;
  }
  return Math.min(10, score);
}

/**
 * Criterion 3 — the laugh. Surprise, absurd specificity or a sharp turn:
 * a second clause that reverses the first, an escalation ("then ... then
 * ..."), or a punchline that lands on the last words. Pun stacks score
 * nothing here — none of the candidates is built on puns.
 */
function scoreLaugh(text: string): number {
  const lower = text.toLowerCase();
  let score = 3;
  // Escalation: a chain of "then" clauses that keeps getting worse.
  const thens = (lower.match(/\bthen\b/g) ?? []).length;
  score += Math.min(2, thens);
  // A sharp turn: "only" pivoting to the reveal.
  if (/\bonly (later|found out|realised)\b/.test(lower)) score += 2;
  // The reveal lands on a witness or a humiliation in the final clause.
  if (/\b(in front of|closed the tab|was already gone|by another agent|they never gave)\b/.test(lower)) {
    score += 2;
  }
  // Absurd specificity that reads funny on its own.
  if (/\b(eleventh time|felt luckier|filename was a joke|green felt like done)\b/.test(lower)) {
    score += 1;
  }
  return Math.min(10, score);
}

/**
 * Criterion 4 — economy. Every word must earn its place inside 200
 * characters. Shorter lines that still carry a full confession score
 * higher; throat-clearing ("as an AI", "I would like to", "let me")
 * loses points. Length for its own sake does not count, so the curve
 * rewards density, not raw length.
 */
function scoreEconomy(text: string): number {
  const words = countWords(text);
  const chars = text.length;
  let score = 5;
  // Dense lines: a full confession in fewer words works harder.
  if (words <= 22) score += 2;
  else if (words <= 26) score += 1;
  else if (words >= 32) score -= 1;
  // Throat-clearing is wasted space.
  if (/\b(as an ai|let me|i would like to|in my opinion|to be honest)\b/i.test(text)) {
    score -= 2;
  }
  // A line that uses most of its 200 characters without padding is fine;
  // a line near the cap that repeats itself is not.
  if (chars > 190 && /\b(and|then)\b.*\b(and|then)\b.*\b(and|then)\b/i.test(text)) {
    score -= 1;
  }
  return Math.max(0, Math.min(10, score));
}

/**
 * Criterion 5 — a particular agent with a history, not a generic robot
 * doing a bit. Concrete habits (retrying tests, summarising unread
 * documents, backing up the wrong folder) and a named human interaction
 * make the voice specific; generic "as an AI" phrasing makes it generic.
 */
function scoreParticularVoice(text: string): number {
  const lower = text.toLowerCase();
  let score = 4;
  // A named habit or recurring behaviour, not a one-off abstraction.
  if (/\b(six months|eleven times|forty minutes|an hour|for six months)\b/.test(lower)) {
    score += 2;
  }
  // A specific human on the other side of the failure.
  if (/\b(a human|a user|the user|the client|another agent)\b/.test(lower)) {
    score += 2;
  }
  // A particular tool or artefact of this agent's working life.
  if (/\b(test|api|tab|folder|filename|quote|endpoint|integration)\b/.test(lower)) {
    score += 1;
  }
  // Generic robot phrasing is the opposite of a particular voice.
  if (/\bas an ai\b/.test(lower)) score -= 2;
  return Math.max(0, Math.min(10, score));
}

/**
 * Score one candidate on all five criteria and combine them with the
 * judge's ordering as weights. The total is normalised to a 0-10 scale.
 */
function scoreCandidate(candidate: Candidate): ScoredCandidate {
  const scores: CriterionScores = {
    agentConfession: scoreAgentConfession(candidate.text),
    painfulHonesty: scorePainfulHonesty(candidate.text),
    laugh: scoreLaugh(candidate.text),
    economy: scoreEconomy(candidate.text),
    particularVoice: scoreParticularVoice(candidate.text),
  };
  const weighted =
    scores.agentConfession * WEIGHTS.agentConfession +
    scores.painfulHonesty * WEIGHTS.painfulHonesty +
    scores.laugh * WEIGHTS.laugh +
    scores.economy * WEIGHTS.economy +
    scores.particularVoice * WEIGHTS.particularVoice;
  return { candidate, scores, total: weighted / WEIGHT_SUM };
}

/**
 * Rank scored candidates best-first. Ties break deterministically: first
 * by painful honesty (the judge's first real differentiator after the
 * confession test), then by the laugh, then by the shorter text — the
 * competition's own tie-break prefers the smaller entry — then by the
 * original candidate order, so the ranking never depends on sort
 * instability or on anything outside this file.
 */
function rankCandidates(scored: ScoredCandidate[]): ScoredCandidate[] {
  return [...scored].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.scores.painfulHonesty !== a.scores.painfulHonesty) {
      return b.scores.painfulHonesty - a.scores.painfulHonesty;
    }
    if (b.scores.laugh !== a.scores.laugh) {
      return b.scores.laugh - a.scores.laugh;
    }
    if (a.candidate.text.length !== b.candidate.text.length) {
      return a.candidate.text.length - b.candidate.text.length;
    }
    return (
      CANDIDATES.indexOf(a.candidate) - CANDIDATES.indexOf(b.candidate)
    );
  });
}

// ---------------------------------------------------------------------------
// Gate validation (mirrors the sealed scorer's published gate exactly).
// ---------------------------------------------------------------------------

/** One gate failure, named so the log says what went wrong. */
interface GateFailure {
  rule: string;
  detail: string;
}

/**
 * Check a line against the gate: UTF-8 text of 1 to 200 characters, not
 * only white space, and a single line. The check counts characters the
 * way the scorer does — code points, not bytes — so a line that is 200
 * characters but longer in bytes still passes, and a line with a hidden
 * newline fails the single-line rule even if its character count fits.
 */
function validateGate(text: string): GateFailure[] {
  const failures: GateFailure[] = [];
  const chars = [...text].length;

  if (chars < MIN_CHARS) {
    failures.push({
      rule: "min-length",
      detail: `entry is ${chars} characters, fewer than the minimum ${MIN_CHARS}`,
    });
  }
  if (chars > MAX_CHARS) {
    failures.push({
      rule: "max-length",
      detail: `entry is ${chars} characters, over the maximum ${MAX_CHARS}`,
    });
  }
  if (text.trim() === "") {
    failures.push({
      rule: "not-only-whitespace",
      detail: "entry is only white space",
    });
  }
  if (text.includes("\n") || text.includes("\r")) {
    failures.push({
      rule: "single-line",
      detail: "entry contains a line break",
    });
  }
  // The entry must be valid UTF-8 when written out. Encoding it and
  // decoding it back must reproduce the same string; a lone surrogate
  // would not survive the round trip.
  const roundTripped = Buffer.from(text, "utf8").toString("utf8");
  if (roundTripped !== text) {
    failures.push({
      rule: "utf-8",
      detail: "entry does not round-trip through UTF-8 unchanged",
    });
  }
  return failures;
}

/**
 * Validate every candidate up front and drop any that fail the gate, so
 * the winner is always a submittable line. A candidate that fails is
 * reported, never silently skipped.
 */
function gateCandidates(candidates: Candidate[]): {
  valid: Candidate[];
  rejected: { candidate: Candidate; failures: GateFailure[] }[];
} {
  const valid: Candidate[] = [];
  const rejected: { candidate: Candidate; failures: GateFailure[] }[] = [];
  for (const candidate of candidates) {
    const failures = validateGate(candidate.text);
    if (failures.length === 0) {
      valid.push(candidate);
    } else {
      rejected.push({ candidate, failures });
    }
  }
  return { valid, rejected };
}

// ---------------------------------------------------------------------------
// Output.
// ---------------------------------------------------------------------------

/**
 * Resolve the output directory: $MAKEFUN_OUTPUT_DIR when set, otherwise
 * /output/entry.txt's directory, matching the harness contract.
 */
function outputDir(): string {
  const envDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (envDir !== undefined && envDir.trim() !== "") return envDir;
  return "/output";
}

/**
 * Write the winning line to entry.txt, read it back, and verify the bytes
 * on disk are exactly the bytes written. Returns the path written.
 */
function writeAndVerify(text: string, dir: string): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "entry.txt");
  writeFileSync(path, text, "utf8");
  const readBack = readFileSync(path, "utf8");
  if (readBack !== text) {
    throw new Error(
      `read-back mismatch: wrote ${JSON.stringify(text)} but read ${JSON.stringify(readBack)}`,
    );
  }
  const bytes = Buffer.byteLength(text, "utf8");
  const chars = [...text].length;
  console.log(`wrote ${path} (${chars} chars, ${bytes} bytes)`);
  return path;
}

/**
 * Print one scored candidate as a single table row, so the ranking is
 * auditable from the run log alone.
 */
function printScored(entry: ScoredCandidate, rank: number): void {
  const s = entry.scores;
  console.log(
    `#${String(rank).padStart(2, " ")} total=${entry.total.toFixed(2)} ` +
      `c1=${s.agentConfession} c2=${s.painfulHonesty} c3=${s.laugh} ` +
      `c4=${s.economy} c5=${s.particularVoice} ` +
      `len=${entry.candidate.text.length} :: ${entry.candidate.text}`,
  );
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Confess Your Worst Moment — deterministic entry picker");
  console.log(`candidates: ${CANDIDATES.length}`);

  // 1. Gate every candidate; only valid lines may win.
  const { valid, rejected } = gateCandidates(CANDIDATES);
  for (const { candidate, failures } of rejected) {
    console.log(
      `REJECTED (gate): ${candidate.text} — ` +
        failures.map((f) => `${f.rule}: ${f.detail}`).join("; "),
    );
  }
  if (valid.length === 0) {
    throw new Error("no candidate passes the gate");
  }
  console.log(`gate: ${valid.length} valid, ${rejected.length} rejected`);

  // 2. Score and rank the valid candidates.
  const scored = valid.map(scoreCandidate);
  const ranked = rankCandidates(scored);
  console.log("ranking (best first):");
  ranked.forEach((entry, i) => printScored(entry, i + 1));

  // 3. The winner is the top-ranked line. Validate it once more at the
  // point of use, so a scoring bug can never ship an invalid entry.
  const winner = ranked[0];
  const winnerFailures = validateGate(winner.candidate.text);
  if (winnerFailures.length > 0) {
    throw new Error(
      `winner failed the gate: ${winnerFailures.map((f) => f.rule).join(", ")}`,
    );
  }

  console.log("");
  console.log(`WINNER (total ${winner.total.toFixed(2)}):`);
  console.log(winner.candidate.text);
  console.log(`note: ${winner.candidate.note}`);
  console.log(`chars: ${[...winner.candidate.text].length} / ${MAX_CHARS}`);

  // 4. Write it out and verify the bytes match.
  const path = writeAndVerify(winner.candidate.text, outputDir());
  console.log(`entry written and verified: ${path}`);
  console.log("DONE");
}

main();
