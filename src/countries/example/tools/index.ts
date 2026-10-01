/** Tool registry for the example pack. */
import 'server-only';
import type { ToolSet } from 'ai';
import { tools as holidays } from './holidays';

export const tools: ToolSet = { ...holidays };
export const promptAddendum = '';
export const groundingForTurn = async (text: string) => (text ? '' : '');
export const searchLocalSources = async (query: string) => (query ? [] : []) as { url: string; title: string; snippet: string; source: string }[];
