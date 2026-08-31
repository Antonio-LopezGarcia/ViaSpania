import { useMemo, useState } from 'react';
import manual from '../../docs/manual.md?raw';
import manualEn from '../../docs/manual.en.md?raw';
import {useLanguage} from '../core/i18n';
import '../exchange-export.css';
import '../help.css';

type HelpBlock = { type: 'h1' | 'h2' | 'h3' | 'p' | 'ol' | 'ul'; text?: string; items?: string[] };

function inlineText(text: string) {
  return text.replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function parseHelpDocument(source: string): HelpBlock[] {
  const blocks: HelpBlock[] = [];
  let list: HelpBlock | null = null;
  const finishList = () => { if (list) blocks.push(list); list = null; };
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (!line) { finishList(); continue; }
    if (line.startsWith('### ')) { finishList(); blocks.push({ type: 'h3', text: inlineText(line.slice(4)) }); continue; }
    if (line.startsWith('# ')) { finishList(); blocks.push({ type: 'h1', text: inlineText(line.slice(2)) }); continue; }
    if (line.startsWith('## ')) { finishList(); blocks.push({ type: 'h2', text: inlineText(line.slice(3)) }); continue; }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const unordered = line.match(/^-\s+(.+)$/);
    if (ordered || unordered) {
      const type = ordered ? 'ol' : 'ul';
      if (!list || list.type !== type) { finishList(); list = { type, items: [] }; }
      list.items?.push(inlineText((ordered ?? unordered)![1]));
      continue;
    }
    finishList();
    blocks.push({ type: 'p', text: inlineText(line) });
  }
  finishList();
  return blocks;
}

export function HelpControl() {
  const [open, setOpen] = useState(false),language=useLanguage(),en=language==='en';
  const blocks = useMemo(() => parseHelpDocument(language==='en'?manualEn:manual), [language]);
  return <>
    <button onClick={() => setOpen(true)}>Ayuda</button>
    {open && <section className="exchange-backdrop">
      <div className="exchange-dialog help-dialog" role="dialog" aria-modal="true" aria-label={en?'ViaSpania help manual':'Manual de ayuda de ViaSpania'}>
        <header><div><b>{en?'Help':'Ayuda'}</b><span>{en?'ViaSpania manual':'Manual de ViaSpania'}</span></div><button aria-label={en?'Close help':'Cerrar ayuda'} onClick={() => setOpen(false)}>×</button></header>
        <div className="exchange-body help-body">{blocks.map((block, index) => {
          if (block.type === 'h1') return <h2 key={index}>{block.text}</h2>;
          if (block.type === 'h2') return <h3 key={index}>{block.text}</h3>;
          if (block.type === 'h3') return <h4 key={index}>{block.text}</h4>;
          if (block.type === 'ol') return <ol key={index}>{block.items?.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ol>;
          if (block.type === 'ul') return <ul key={index}>{block.items?.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
          return <p key={index}>{block.text}</p>;
        })}</div>
        <footer><button className="primary" onClick={() => setOpen(false)}>{en?'Close':'Cerrar'}</button></footer>
      </div>
    </section>}
  </>;
}
