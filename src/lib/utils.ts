import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn=(...inputs:ClassValue[])=>twMerge(clsx(inputs));
export function slugify(text:string){return text.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'product';}
export function formatFileSize(bytes:number|null){if(!bytes)return '—';const s=['B','KB','MB','GB','TB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),s.length-1);return `${(bytes/1024**i).toFixed(i?1:0)} ${s[i]}`;}
export function formatDate(date:string|null){return date?new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'—';}
export function hashKeyBrowser(value:string){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.trim())).then(b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''));}
