/**
 * find-missing-entities.ts
 *
 * Scans diary entries for capitalized proper nouns that might be entities
 * not yet in the wiki. Outputs candidates grouped by frequency.
 *
 * Usage: npx tsx scripts/find-missing-entities.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const WIKI_DIR = path.join(ROOT, 'src', 'content', 'wiki');
const DIARY_DIR = path.join(ROOT, 'src', 'content', 'diary');

// Load existing wiki entry titles and aliases
const wikiFiles = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md'));
const knownNames = new Set<string>();

for (const file of wikiFiles) {
  const raw = fs.readFileSync(path.join(WIKI_DIR, file), 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const fm = match[1];

  // Extract title
  const titleMatch = fm.match(/^title:\s*"?([^"\n]+)"?/m);
  if (titleMatch) knownNames.add(titleMatch[1].toLowerCase());

  // Extract aliases
  const aliasMatches = fm.matchAll(/^\s+-\s+"?([^"\n]+)"?/gm);
  for (const m of aliasMatches) {
    knownNames.add(m[1].toLowerCase());
  }
}

// Also add the slug form
for (const file of wikiFiles) {
  knownNames.add(file.replace(/\.md$/, '').replace(/-/g, ' '));
}

console.log(`Known wiki names: ${knownNames.size}`);

// Common words to exclude
const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'not', 'no', 'nor', 'so', 'too',
  'very', 'just', 'also', 'then', 'than', 'that', 'this', 'these', 'those',
  'he', 'she', 'it', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them',
  'my', 'his', 'its', 'our', 'your', 'their', 'what', 'which', 'who', 'whom',
  'when', 'where', 'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'only', 'own', 'same', 'if', 'because',
  'about', 'up', 'out', 'into', 'over', 'after', 'before', 'between', 'under',
  'again', 'further', 'once', 'here', 'there', 'any', 'while', 'during',
  // D&D common terms that aren't proper nouns
  'session', 'chapter', 'game', 'party', 'group', 'attack', 'attacks', 'damage',
  'level', 'spell', 'spells', 'round', 'rounds', 'action', 'actions', 'bonus',
  'hit', 'miss', 'roll', 'check', 'save', 'saving', 'throw', 'ability', 'score',
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'armor', 'class', 'weapon', 'shield', 'sword', 'axe', 'bow', 'staff',
  'gold', 'silver', 'copper', 'platinum', 'rest', 'long', 'short',
  'north', 'south', 'east', 'west', 'left', 'right', 'door', 'doors', 'room',
  'rooms', 'hall', 'hallway', 'tunnel', 'cave', 'floor', 'wall', 'walls',
  'night', 'day', 'morning', 'evening', 'dawn', 'dusk', 'time',
  'back', 'way', 'place', 'area', 'side', 'end', 'part', 'point',
  'man', 'men', 'woman', 'women', 'people', 'person', 'king', 'queen',
  'lord', 'lady', 'knight', 'guard', 'guards', 'soldier', 'soldiers',
  'dragon', 'dragons', 'giant', 'giants', 'goblin', 'goblins', 'orc', 'orcs',
  'dwarf', 'dwarves', 'elf', 'elves', 'human', 'humans', 'halfling',
  'magic', 'magical', 'arcane', 'divine', 'holy', 'dark', 'light',
  'fire', 'water', 'earth', 'air', 'ice', 'lightning', 'thunder',
  'dead', 'death', 'life', 'alive', 'kill', 'killed', 'fight', 'fighting',
  'head', 'hand', 'hands', 'eye', 'eyes', 'body', 'blood',
  'found', 'find', 'take', 'took', 'give', 'gave', 'make', 'made',
  'go', 'went', 'gone', 'come', 'came', 'see', 'saw', 'seen',
  'know', 'knew', 'think', 'thought', 'tell', 'told', 'say', 'said',
  'first', 'last', 'next', 'new', 'old', 'good', 'bad', 'great', 'big',
  'small', 'large', 'high', 'low', 'many', 'much', 'several', 'few',
  'well', 'still', 'even', 'however', 'though', 'although', 'yet',
  'now', 'already', 'soon', 'later', 'finally', 'suddenly', 'quickly',
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'one', 'hundred', 'thousand', 'second', 'third', 'half',
  'behind', 'through', 'around', 'near', 'far', 'away', 'down',
  'off', 'below', 'above', 'across', 'along', 'among', 'upon',
  'inside', 'outside', 'within',
  'gets', 'got', 'getting', 'let', 'puts', 'put', 'set', 'sets',
  'run', 'runs', 'running', 'look', 'looks', 'looking',
  'something', 'anything', 'nothing', 'everything', 'someone', 'anyone',
  'thing', 'things', 'enough', 'another', 'either', 'neither',
  'seems', 'seem', 'appear', 'appears', 'becomes', 'become',
  'keep', 'keeps', 'kept', 'turn', 'turns', 'turned',
  'try', 'tries', 'tried', 'start', 'starts', 'started', 'begin', 'begins',
  'move', 'moves', 'moving', 'stand', 'standing', 'stood',
  'ask', 'asks', 'asked', 'answer', 'answers',
  'open', 'opens', 'opened', 'close', 'closes', 'closed',
  'hear', 'hears', 'heard', 'speak', 'speaks', 'spoke',
  'leave', 'leaves', 'reach', 'reaches', 'reached',
  'able', 'unable', 'decide', 'decides', 'decided',
  'help', 'helps', 'helped', 'use', 'uses', 'using', 'used',
  'want', 'wants', 'wanted', 'like', 'likes', 'liked',
  'believe', 'believes', 'feel', 'feels', 'felt',
  'call', 'calls', 'called', 'name', 'named',
  'die', 'dies', 'died', 'live', 'lives', 'lived',
  'bring', 'brings', 'brought', 'send', 'sends', 'sent',
  'hold', 'holds', 'held', 'carry', 'carries', 'carried',
  'pass', 'passes', 'passed', 'follow', 'follows', 'followed',
  'lead', 'leads', 'led', 'show', 'shows', 'showed',
  'break', 'breaks', 'broken', 'fall', 'falls', 'fell',
  'power', 'powerful', 'force', 'forces', 'strong', 'strength',
  'true', 'false', 'real', 'actually', 'really', 'quite',
  'world', 'land', 'city', 'town', 'village', 'castle', 'tower',
  'forest', 'mountain', 'mountains', 'river', 'sea', 'ocean', 'lake',
  'road', 'path', 'bridge', 'gate', 'gates', 'house', 'home',
  'stone', 'iron', 'steel', 'wood', 'wooden',
  'black', 'white', 'red', 'blue', 'green', 'grey', 'gray', 'yellow',
  'ancient', 'massive', 'huge', 'entire', 'strange', 'various',
  'together', 'apart', 'perhaps', 'maybe', 'certainly', 'simply',
  'able', 'possible', 'impossible', 'different', 'same', 'clear',
  'against', 'towards', 'toward',
  // More game terms
  'hp', 'ac', 'dc', 'dm', 'pc', 'npc', 'xp',
  'feet', 'foot', 'mile', 'miles', 'inch', 'inches',
  'potion', 'potions', 'scroll', 'scrolls', 'wand', 'ring', 'rings',
  'cloak', 'boots', 'helm', 'helmet', 'gauntlets', 'amulet',
  'chest', 'treasure', 'trap', 'traps', 'secret', 'hidden',
  'battle', 'combat', 'war', 'peace', 'army', 'armies',
  'undead', 'vampire', 'skeleton', 'zombie', 'ghost', 'spirit',
  'demon', 'devil', 'angel', 'god', 'gods', 'goddess',
  'priest', 'cleric', 'paladin', 'wizard', 'warlock', 'sorcerer',
  'rogue', 'ranger', 'fighter', 'barbarian', 'bard', 'druid', 'monk',
  'creature', 'creatures', 'monster', 'monsters', 'beast', 'beasts',
  'friend', 'friends', 'enemy', 'enemies', 'ally', 'allies',
  'order', 'guild', 'council', 'group', 'band', 'clan', 'tribe',
  'inn', 'tavern', 'shop', 'temple', 'church', 'market', 'streets',
  'race', 'races', 'age', 'ages',
  'plane', 'planes', 'realm', 'realms', 'dimension',
  // Extra common words that show up as false positives
  'apparently', 'eventually', 'immediately', 'especially', 'particularly',
  'continue', 'continues', 'continued', 'return', 'returns', 'returned',
  'discover', 'discovers', 'discovered', 'reveal', 'reveals', 'revealed',
  'realize', 'realizes', 'realized', 'remember', 'remembers', 'remembered',
  'explain', 'explains', 'explained', 'agree', 'agrees', 'agreed',
  'accept', 'accepts', 'accepted', 'refuse', 'refuses', 'refused',
  'offer', 'offers', 'offered', 'promise', 'promises', 'promised',
  'warn', 'warns', 'warned', 'notice', 'notices', 'noticed',
  'mention', 'mentions', 'mentioned', 'describe', 'describes', 'described',
  'suggest', 'suggests', 'suggested', 'demand', 'demands', 'demanded',
  'before', 'after', 'later', 'earlier', 'until', 'since',
  'meanwhile', 'however', 'instead', 'rather', 'otherwise',
  'whether', 'unless', 'except', 'despite', 'besides',
  // More false positive words
  'notes', 'note', 'told', 'tells', 'saying', 'says',
  'rest', 'resting', 'rested', 'sleep', 'sleeping', 'slept',
  'enters', 'enter', 'entered', 'exit', 'exits', 'exited',
  'picks', 'pick', 'picked', 'drops', 'drop', 'dropped',
  'walks', 'walk', 'walked', 'rides', 'ride', 'rode',
  'pushes', 'push', 'pushed', 'pulls', 'pull', 'pulled',
  'seems', 'seem', 'seemed', 'become', 'becomes', 'became',
  'among', 'between', 'beside', 'underneath', 'above',
  'succeed', 'succeeds', 'succeeded', 'fail', 'fails', 'failed',
  'change', 'changes', 'changed', 'remain', 'remains', 'remained',
  'wait', 'waits', 'waited', 'watch', 'watches', 'watched',
  'fight', 'fights', 'fought', 'strike', 'strikes', 'struck',
  'catch', 'catches', 'caught', 'throw', 'throws', 'thrown',
  'wear', 'wears', 'wore', 'claim', 'claims', 'claimed',
  'control', 'controls', 'controlled', 'protect', 'protects', 'protected',
  'destroy', 'destroys', 'destroyed', 'create', 'creates', 'created',
  'summon', 'summons', 'summoned', 'teleport', 'teleports', 'teleported',
  'cast', 'casts', 'casting', 'rage', 'raging',
  'charm', 'charmed', 'curse', 'cursed', 'bless', 'blessed',
  'invisible', 'flying', 'flies', 'fly', 'levitate',
  'firebolt', 'fireball', 'lightning bolt', 'eldritch blast',
  'cantrip', 'ritual', 'concentration', 'resistance',
  // Adjective false positives
  'nearby', 'certain', 'entire', 'current', 'recent', 'former',
  'young', 'elder', 'middle', 'minor', 'major', 'main',
  'evil', 'chaotic', 'lawful', 'neutral', 'pure',
  'sacred', 'profane', 'blessed', 'cursed', 'enchanted',
  'human', 'elven', 'dwarven', 'celestial', 'infernal', 'abyssal',
  // More
  'aware', 'surprised', 'confused', 'afraid', 'angry', 'happy', 'sad',
  'free', 'safe', 'dangerous', 'difficult', 'easy', 'simple',
  'important', 'necessary', 'ready', 'willing', 'known', 'unknown',
]);

// Scan diary entries for capitalized multi-word names
const diaryFiles = fs.readdirSync(DIARY_DIR).filter(f => f.endsWith('.md')).sort();
const candidateCounts = new Map<string, number>();

// Patterns for proper nouns — capitalized words, possibly multi-word
// Match sequences of capitalized words
const properNounPattern = /\b([A-Z][a-z]+(?:\s+(?:of|the|von|van|de|du|le|la|al|el|d'|mc|mac)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
// Also match single capitalized words in ALL CAPS (common in early diary entries)
const allCapsPattern = /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/g;
// Single capitalized words that aren't at sentence start
const singleCapPattern = /(?<=[a-z.,;:!?]\s+)([A-Z][a-z]{2,})\b/g;

for (const file of diaryFiles) {
  const raw = fs.readFileSync(path.join(DIARY_DIR, file), 'utf-8');
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
  const body = match ? raw.slice(match[0].length) : raw;

  const found = new Set<string>();

  // Multi-word proper nouns
  for (const m of body.matchAll(properNounPattern)) {
    found.add(m[1]);
  }

  // ALL CAPS words
  for (const m of body.matchAll(allCapsPattern)) {
    // Convert to title case
    const titleCase = m[1].split(/\s+/).map(w =>
      w.charAt(0) + w.slice(1).toLowerCase()
    ).join(' ');
    found.add(titleCase);
  }

  // Single capitalized words mid-sentence
  for (const m of body.matchAll(singleCapPattern)) {
    found.add(m[1]);
  }

  for (const name of found) {
    if (name.length < 3) continue;
    const lower = name.toLowerCase();
    if (stopWords.has(lower)) continue;
    if (knownNames.has(lower)) continue;
    // Skip if all words are stop words
    const words = lower.split(/\s+/);
    if (words.every(w => stopWords.has(w))) continue;

    candidateCounts.set(name, (candidateCounts.get(name) || 0) + 1);
  }
}

// Sort by frequency
const sorted = [...candidateCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log('\n=== Missing entity candidates (mentioned in 2+ diary entries) ===\n');
for (const [name, count] of sorted) {
  if (count < 2) break;
  console.log(`  ${count}x  ${name}`);
}

console.log(`\nTotal candidates with 2+ mentions: ${sorted.filter(([, c]) => c >= 2).length}`);
