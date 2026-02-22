export type Room = 'fumatori' | 'non-fumatori';
export type EventType = 'Mangiare e bere' | 'Partita (indica quale nelle note)' | 'Quizzami (disponibile solo il Giovedì)' | 'Serata Italiana (disponibile solo il Venerdì)' | 'DJ set (disponibile solo il Sabato)' | 'Altro';

export interface Reservation {
  id?: number;
  date: string; // YYYY-MM-DD
  tableName: string;
  peopleCount: number;
  tableNumber?: string;
  time: string; // HH:mm
  room: Room;
  event: EventType;
  notes?: string;
}

export const ROOM_CAPACITIES = {
  fumatori: 40,
  'non-fumatori': 140,
};

export const EVENT_TYPES: EventType[] = [
  'Mangiare e bere',
  'Partita (indica quale nelle note)',
  'Quizzami (disponibile solo il Giovedì)',
  'Serata Italiana (disponibile solo il Venerdì)',
  'DJ set (disponibile solo il Sabato)',
  'Altro',
];
