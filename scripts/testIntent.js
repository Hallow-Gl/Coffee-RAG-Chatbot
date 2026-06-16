// scripts/testIntent.js — quick sanity check, no API calls
import { detectIntent } from '../src/services/intentService.js';

const cases = [
  ['Why does my espresso taste sour?',              'knowledge'],
  ['best hand grinder under 2000 pesos',            'product'],
  ['what grinder for french press under 3000',      'combined'],
  ['how do I use a moka pot?',                      'knowledge'],
  ['recommend a cheap espresso machine',            'product'],
  ['difference between v60 and french press',       'knowledge'],
  ['where to buy coffee beans in Philippines',      'product'],
  ['what beans should I buy for chocolatey flavor', 'combined'],
];

cases.forEach(([query, expected]) => {
  const got = detectIntent(query);
  const ok  = got === expected;
  console.log(`${ok ? 'OKAY' : 'FAILED'} [${got}] ${query}`);
  if (!ok) console.log(`   expected: ${expected}`);
});