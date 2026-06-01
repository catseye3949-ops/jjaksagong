export type Cheerleader = {
  id: number;
  rank: number;
  name: string;
  team: string;
  intro: string;
};

export type Game = {
  id: number;
  stadium: string;
  matchup: string;
  time: string;
  expectedCheerleaders: string[];
};

export type Fancam = {
  id: number;
  title: string;
  channel: string;
  views: string;
};

export type Message = {
  id: number;
  author: string;
  text: string;
};
