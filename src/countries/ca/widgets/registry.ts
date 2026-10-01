/**
 * Widget renderer registry for the Canada pack. PRE-STUBBED: widget agents never edit this file.
 * Widgets load lazily (code-split per widget) the first time one of their tools appears in a chat.
 * A tool named `passportPlanner` is routed to the widget whose prefix is `passport`.
 */
import { createElement } from 'react';
import type { WidgetEntry } from '@/lib/widgets/types';
import { PassportCover } from './passport/PassportCover';

export const widgets: WidgetEntry[] = [
  { id: 'benefits', prefix: 'benefits', load: () => import('./benefits') },
  {
    id: 'passport',
    prefix: 'passport',
    load: () => import('./passport'),
    heads: {
      passportPlanner: {
        title: { en: 'Passport renewal planner', fr: 'Planificateur de renouvellement de passeport' },
        subtitle: { en: 'Adult passport · applying in Canada', fr: 'Passeport pour adulte · demande au Canada' },
        iconNode: () => createElement(PassportCover),
        rows: 4,
      },
    },
  },
  { id: 'immigration', prefix: 'immigration', load: () => import('./immigration') },
  { id: 'citizenship', prefix: 'citizenship', load: () => import('./citizenship') },
  { id: 'jobs', prefix: 'jobs', load: () => import('./jobs') },
  { id: 'taxes', prefix: 'taxes', load: () => import('./taxes') },
  { id: 'weather', prefix: 'weather', load: () => import('./weather') },
  { id: 'travel', prefix: 'travel', load: () => import('./travel') },
  { id: 'offices', prefix: 'offices', load: () => import('./offices') },
  { id: 'life-events', prefix: 'lifeEvents', load: () => import('./life-events') },
  { id: 'dates', prefix: 'dates', load: () => import('./dates') },
  { id: 'health', prefix: 'health', load: () => import('./health') },
  { id: 'parks', prefix: 'parks', load: () => import('./parks') },
  { id: 'business', prefix: 'business', load: () => import('./business') },
  { id: 'documents', prefix: 'documents', load: () => import('./documents') },
  { id: 'contact', prefix: 'contact', load: () => import('./contact') },
  { id: 'civic', prefix: 'civic', load: () => import('./civic') },
  { id: 'money', prefix: 'money', load: () => import('./money') },
  { id: 'veterans-defence', prefix: 'veteransDefence', load: () => import('./veterans-defence') },
  { id: 'transport', prefix: 'transport', load: () => import('./transport') },
];
