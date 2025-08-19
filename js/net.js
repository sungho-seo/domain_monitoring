import { CACHE_BUST } from './config.js';

const bust = (url) => url + (url.includes('?') ? '&' : '?') + CACHE_BUST();

export async function fetchText(url){
  const res = await fetch(bust(url), { cache: 'no-store' });
  if(!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}
export async function fetchJSON(url){
  const res = await fetch(bust(url), { cache: 'no-store' });
  if(!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
export { bust };
