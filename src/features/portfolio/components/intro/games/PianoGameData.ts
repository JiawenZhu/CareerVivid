export interface Note {
    key: string;
    note: string;
    label: string;
}

export const NOTES: Note[] = [
    { key: 'a', note: 'C4', label: 'C' },
    { key: 's', note: 'D4', label: 'D' },
    { key: 'd', note: 'E4', label: 'E' },
    { key: 'f', note: 'F4', label: 'F' },
    { key: 'g', note: 'G4', label: 'G' },
    { key: 'h', note: 'A4', label: 'A' },
    { key: 'j', note: 'B4', label: 'B' },
    { key: 'k', note: 'C5', label: 'C5' },
];

export const SONG_SUGGESTIONS = [
    'Moonlight Sonata',
    'Fur Elise',
    'Clair de Lune',
    'Imagine',
    'Bohemian Rhapsody',
    'Let It Be',
    'Tiny Dancer',
    'Piano Man',
];
