import type { Cheerleader } from "@/types/cheeron";

export const todayPopularCheerleaders: Cheerleader[] = [
  { id: 1, rank: 1, name: "이수아", team: "두산 베어스", intro: "파워풀한 응원 리드와 밝은 에너지" },
  { id: 2, rank: 2, name: "김나연", team: "롯데 자이언츠", intro: "관중 호응을 끌어내는 무대 장인" },
  { id: 3, rank: 3, name: "박지윤", team: "LG 트윈스", intro: "세련된 안무와 안정적인 퍼포먼스" },
];

export function getCheerleaderById(id: number): Cheerleader | undefined {
  return todayPopularCheerleaders.find((cheerleader) => cheerleader.id === id);
}
