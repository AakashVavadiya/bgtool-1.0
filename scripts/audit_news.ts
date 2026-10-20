import { getNewsArticles, articleCharCount } from "../src/lib/news";

const MIN = 4000;
const articles = getNewsArticles();
let failed = 0;
let min = Infinity;
let max = 0;

for (const a of articles) {
  const n = articleCharCount(a);
  min = Math.min(min, n);
  max = Math.max(max, n);
  if (n < MIN) {
    failed++;
    console.error(`FAIL ${a.slug}: ${n} chars`);
  }
}

console.log(`Articles: ${articles.length}, min ${min} chars, max ${max} chars, failures: ${failed}`);
process.exit(failed ? 1 : 0);
