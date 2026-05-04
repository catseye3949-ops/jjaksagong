/** solarlunar 패키지의 package exports와 typings 연결이 끊겨 있어 보강합니다. */
declare module "solarlunar" {
  export interface SolarLunarResult {
    cYear: number;
    cMonth: number;
    cDay: number;
    isTerm: boolean;
    term: string;
  }

  interface SolarLunarApi {
    lunarTerm: string[];
    solar2lunar(year?: number, month?: number, day?: number): SolarLunarResult | -1;
    /** 공력 y년 제 n번 절기(1=小寒 … 24=冬至)의 해당 양력 월 일 */
    getTerm(year: number, n: number): number;
  }

  const solarlunar: SolarLunarApi;
  export default solarlunar;
}
