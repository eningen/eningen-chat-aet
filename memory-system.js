/* Chat AET Memory System
 * Lightweight local memory for guest sessions.
 * Stores only compact, useful summaries instead of full conversations.
 */
const AET_MEMORY_KEY = 'chat_aet_memory_v1';
const AET_MEMORY_LIMIT = 100;

function aetLoadMemory() {
  try { return JSON.parse(localStorage.getItem(AET_MEMORY_KEY) || '[]'); }
  catch (_) { return []; }
}
function aetSaveMemory(memory) {
  localStorage.setItem(AET_MEMORY_KEY, JSON.stringify(memory.slice(-AET_MEMORY_LIMIT)));
}
function aetExtract(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const task = /(作って|作成|追加|実装|変更|修正|開発|作りたい|対応して|お願い)/.test(s);
  const important = task || /(覚えて|記憶|大事|重要|プロジェクト|自作|名前|好み|方針|目標)/.test(s);
  if (!important) return null;

  const projectMatch = s.match(/(stickman\s*Video|Chat\s*AET|チャットAET|自作SNS)/i);
  const project = projectMatch ? projectMatch[1].replace(/\s+/g, ' ').trim() : '';
  const detail = s.replace(/^(じゃあ|では|お願い|まず|次は)\s*/,'').replace(/[。！!]+$/,'').trim();
  const completed = /(完了|完成|できた|出来た|追加済み|実装済み|終了|終わった)/.test(s);

  if (completed) {
    return { level:'completed', major: project ? `${project}で${detail.replace(project,'').trim()}済み` : detail, createdAt:Date.now() };
  }
  const middle = detail.replace(project,'').replace(/(して|ください|ほしい|欲しい|ように|できるように|お願い)/g,' ').replace(/\s+/g,' ').trim();
  const fineMatch = s.match(/(既存[^。！!]*|壊さず[^。！!]*|影響[^。！!]*)/);
  return {
    level:'task',
    major: project || detail.slice(0, 40),
    middle: middle.slice(0, 80),
    fine: fineMatch ? fineMatch[1].slice(0, 80) : '',
    createdAt:Date.now()
  };
}
function aetRemember(text) {
  const item = aetExtract(text);
  if (!item) return null;
  const memory = aetLoadMemory();
  const normalized = JSON.stringify(item);
  const idx = memory.findIndex(x => x.major === item.major && x.middle === item.middle);
  if (idx >= 0) memory[idx] = {...memory[idx], ...item};
  else memory.push(item);
  aetSaveMemory(memory);
  return item;
}
function aetMemoryContext(query) {
  const q = String(query || '').toLowerCase();
  return aetLoadMemory().filter(m => {
    const hay = JSON.stringify(m).toLowerCase();
    return !q || q.split(/\s+/).some(w => w.length > 1 && hay.includes(w)) || /(stickman|aet|コメント|投稿|検索|天気|ai|開発)/i.test(q) && hay.includes('stickman');
  }).slice(-8);
}
function aetFormatMemory(memory) {
  return memory.map(m => m.level === 'completed'
    ? `大部分：${m.major}`
    : `大部分：${m.major}\n中部分：${m.middle}${m.fine ? `\n細かい部分：${m.fine}` : ''}`
  ).join('\n---\n');
}
function aetClearMemory() { localStorage.removeItem(AET_MEMORY_KEY); }
window.ChatAETMemory = { load:aetLoadMemory, remember:aetRemember, context:aetMemoryContext, format:aetFormatMemory, clear:aetClearMemory };
