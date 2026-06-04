export interface Team { n: string; c: string }
export interface Deadline { urgent: boolean; label: string }
export interface Match {
  id: number; grp: string; time: string;
  deadline?: Deadline; done?: boolean; editUntil?: string;
  a: Team; b: Team; score: [number | null, number | null];
}

export const MATCHES: Match[] = [
  { id: 1, grp: "Grupo C", time: "Hoje 13:00", deadline: { urgent: true, label: "2h10" }, a: { n: "Brasil", c: "BR" }, b: { n: "Sérvia", c: "RS" }, score: [null, null] },
  { id: 2, grp: "Grupo C", time: "Hoje 16:00", deadline: { urgent: false, label: "16:00" }, a: { n: "Suíça", c: "CH" }, b: { n: "Camarões", c: "CM" }, score: [1, null] },
  { id: 3, grp: "Grupo E", time: "Amanhã 13:00", deadline: { urgent: false, label: "amanhã" }, a: { n: "Espanha", c: "ES" }, b: { n: "Japão", c: "JP" }, score: [null, null] },
  { id: 4, grp: "Grupo D", time: "Ontem · encerrado", done: true, editUntil: "—", a: { n: "Argentina", c: "AR" }, b: { n: "México", c: "MX" }, score: [2, 0] },
];
