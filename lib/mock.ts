export interface Team { n: string; c: string }
export interface Deadline { urgent: boolean; label: string }
export interface Match {
  id: string | number; grp: string; time: string;
  deadline?: Deadline; done?: boolean; editUntil?: string;
  upcoming?: boolean; knockout?: boolean; advance?: string;
  a: Team; b: Team; score: [number | null, number | null];
}

/* ── Home ── */
export const MATCHES: Match[] = [
  { id: 1, grp: "Grupo C", time: "Hoje 13:00", deadline: { urgent: true, label: "2h10" }, a: { n: "Brasil", c: "BR" }, b: { n: "Sérvia", c: "RS" }, score: [null, null] },
  { id: 2, grp: "Grupo C", time: "Hoje 16:00", deadline: { urgent: false, label: "16:00" }, a: { n: "Suíça", c: "CH" }, b: { n: "Camarões", c: "CM" }, score: [1, null] },
  { id: 3, grp: "Grupo E", time: "Amanhã 13:00", deadline: { urgent: false, label: "amanhã" }, a: { n: "Espanha", c: "ES" }, b: { n: "Japão", c: "JP" }, score: [null, null] },
  { id: 4, grp: "Grupo D", time: "Ontem · encerrado", done: true, editUntil: "—", a: { n: "Argentina", c: "AR" }, b: { n: "México", c: "MX" }, score: [2, 0] },
];

/* ── Palpites — Grupos ── */
export const GROUP_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const GROUPS: Record<string, Match[]> = {
  C: [
    { id: 10, grp: "Rod. 2", time: "Hoje 13:00", deadline: { urgent: true, label: "2h10" }, a: { n: "Brasil", c: "BR" }, b: { n: "Sérvia", c: "RS" }, score: [null, null] },
    { id: 11, grp: "Rod. 2", time: "Hoje 16:00", deadline: { urgent: false, label: "16:00" }, a: { n: "Suíça", c: "CH" }, b: { n: "Camarões", c: "CM" }, score: [1, null] },
    { id: 12, grp: "Rod. 3", time: "22/jun", upcoming: true, a: { n: "Brasil", c: "BR" }, b: { n: "Suíça", c: "CH" }, score: [null, null] },
    { id: 13, grp: "Rod. 1", time: "Encerrado", done: true, editUntil: "—", a: { n: "Brasil", c: "BR" }, b: { n: "Camarões", c: "CM" }, score: [2, 0] },
  ],
  A: [
    { id: 20, grp: "Rod. 2", time: "Hoje 10:00", deadline: { urgent: false, label: "10:00" }, a: { n: "Catar", c: "QA" }, b: { n: "Senegal", c: "SN" }, score: [null, null] },
    { id: 21, grp: "Rod. 2", time: "Amanhã 13:00", deadline: { urgent: false, label: "amanhã" }, a: { n: "Equador", c: "EC" }, b: { n: "Holanda", c: "NL" }, score: [null, null] },
  ],
};

/* ── Palpites — Mata-mata ── */
export const KO_ROUNDS = [
  { key: "oitavas", label: "Oitavas" }, { key: "quartas", label: "Quartas" },
  { key: "semi", label: "Semi" }, { key: "final", label: "Final" },
];
export const KO: Record<string, Match[]> = {
  oitavas: [
    { id: 30, grp: "Oitava 1", time: "28/jun 13:00", deadline: { urgent: false, label: "28/jun" }, knockout: true, a: { n: "Brasil", c: "BR" }, b: { n: "Uruguai", c: "UY" }, score: [1, 1], advance: "BR" },
    { id: 31, grp: "Oitava 2", time: "28/jun 17:00", deadline: { urgent: false, label: "28/jun" }, knockout: true, a: { n: "França", c: "FR" }, b: { n: "Croácia", c: "HR" }, score: [null, null] },
    { id: 32, grp: "Oitava 3", time: "29/jun 13:00", deadline: { urgent: false, label: "29/jun" }, knockout: true, a: { n: "Inglaterra", c: "EN" }, b: { n: "Senegal", c: "SN" }, score: [2, 0] },
  ],
  quartas: [
    { id: 40, grp: "Quarta 1", time: "04/jul", upcoming: true, a: { n: "Vencedor O1", c: "?" }, b: { n: "Vencedor O2", c: "?" }, score: [null, null] },
  ],
  semi: [], final: [],
};

/* ── Ranking ── */
export interface RankEntry {
  pos: number; name: string; pts: number; cravadas: number; init: string; you?: boolean;
}
export const RANK: RankEntry[] = [
  { pos: 1, name: "Carlos Ribeiro", pts: 184, cravadas: 7, init: "CR" },
  { pos: 2, name: "Júlia Prado", pts: 167, cravadas: 6, init: "JP" },
  { pos: 3, name: "Marcos Teixeira", pts: 152, cravadas: 5, init: "MT" },
  { pos: 4, name: "Ana Martins", pts: 128, cravadas: 5, init: "AM", you: true },
  { pos: 5, name: "Pedro Lima", pts: 121, cravadas: 4, init: "PL" },
  { pos: 6, name: "Bianca Souza", pts: 118, cravadas: 4, init: "BS" },
  { pos: 7, name: "Diego Farias", pts: 109, cravadas: 3, init: "DF" },
  { pos: 8, name: "Letícia Alves", pts: 104, cravadas: 3, init: "LA" },
];
export const RANK_FILTERS = ["Geral", "Fase de grupos", "Mata-mata"];
export const RANK_CAPTIONS: Record<string, string> = {
  "Geral": "Classificação geral do bolão · 32 participantes",
  "Fase de grupos": "Pontos acumulados apenas na fase de grupos",
  "Mata-mata": "Pontos acumulados apenas no mata-mata",
};
