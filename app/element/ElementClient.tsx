"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { calculateIlju } from "@/lib/calculateIlju";
import type { Gender } from "@/lib/domain/user";

const SITE_URL = "https://jjaksagong.com";
const ELEMENT_PATH = "/element";
const KAKAO_JAVASCRIPT_KEY =
  process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? "";

const DAY_STEM_LABELS: Record<string, string> = {
  갑: "갑목",
  을: "을목",
  병: "병화",
  정: "정화",
  무: "무토",
  기: "기토",
  경: "경금",
  신: "신금",
  임: "임수",
  계: "계수",
};

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share?: {
        sendDefault: (settings: {
          objectType: "feed";
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
    };
  }
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

type FormState = {
  gender: Gender | "";
  birthdate: string;
  birthtime: string;
  birthtimeUnknown: boolean;
};

type ResultState = {
  dayStemLabel: string;
  genderSuffix: "남" | "녀";
  birthdate?: string;
  birthtime?: string;
  gender: Gender;
};

function getDayStemLabel(birthdate: string, birthtime: string) {
  const dayPillar = calculateIlju(birthdate, birthtime);
  if (!dayPillar) return null;
  return DAY_STEM_LABELS[dayPillar.slice(0, 1)] ?? null;
}

function isSharedResult(value: string | null): value is string {
  if (!value) return false;
  const stem = value.slice(0, -1);
  const suffix = value.slice(-1);
  return (
    Object.values(DAY_STEM_LABELS).includes(stem) &&
    (suffix === "남" || suffix === "녀")
  );
}

function buildElementSharePath(gender: Gender, resultLabel: string) {
  const q = new URLSearchParams();
  q.set("gender", gender);
  q.set("result", resultLabel);
  return `${ELEMENT_PATH}?${q.toString()}`;
}

function buildAbsoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

export default function ElementClient() {
  const [form, setForm] = useState<FormState>({
    gender: "",
    birthdate: "",
    birthtime: "12:00",
    birthtimeUnknown: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const resultHref = useMemo(() => {
    if (!result?.birthdate) return "/main";
    const q = new URLSearchParams();
    q.set("name", "나");
    q.set("targetName", "나");
    q.set("birthdate", result.birthdate);
    if (result.birthtime) q.set("birthtime", result.birthtime);
    q.set("gender", result.gender);
    return `/result?${q.toString()}`;
  }, [result]);

  const resultLabel = result
    ? `${result.dayStemLabel}${result.genderSuffix}`
    : "";
  const sharePath = result ? buildElementSharePath(result.gender, resultLabel) : "";
  const shareUrl = result ? buildAbsoluteUrl(sharePath) : buildAbsoluteUrl(ELEMENT_PATH);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedResult = params.get("result");
    const sharedGender = params.get("gender");
    if (
      !isSharedResult(sharedResult) ||
      (sharedGender !== "male" && sharedGender !== "female")
    ) {
      return;
    }

    setForm((prev) => ({ ...prev, gender: sharedGender }));
    setResult({
      dayStemLabel: sharedResult.slice(0, -1),
      genderSuffix: sharedResult.slice(-1) as "남" | "녀",
      gender: sharedGender,
    });
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("링크가 복사되었습니다");
    } catch {
      window.prompt("아래 링크를 복사해 주세요.", shareUrl);
    }
  };

  const shareToKakao = async () => {
    if (!result) return;
    const title = `나는 ${resultLabel}래ㅋㅋ`;
    const description = `생년월일로 내 일간 확인해봤더니 ${resultLabel}가 나옴`;

    try {
      if (
        KAKAO_JAVASCRIPT_KEY &&
        window.Kakao?.Share?.sendDefault
      ) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
        }
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description,
            imageUrl: `${SITE_URL}/images/logo/logo.png`,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: "나도 일간 확인하기",
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({ title, text: description, url: shareUrl });
        return;
      }

      await copyShareLink();
    } catch (e) {
      console.error("[element] share failed", e);
      await copyShareLink();
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.gender) {
      setError("성별을 선택해 주세요.");
      return;
    }
    if (!form.birthdate) {
      setError("생년월일을 입력해 주세요.");
      return;
    }

    const birthtime = form.birthtimeUnknown ? "" : form.birthtime;
    const dayStemLabel = getDayStemLabel(form.birthdate, birthtime);
    if (!dayStemLabel) {
      setError("생년월일을 다시 확인해 주세요.");
      return;
    }

    const genderSuffix = form.gender === "female" ? "녀" : "남";
    const nextResult = {
      dayStemLabel,
      genderSuffix,
      birthdate: form.birthdate,
      birthtime,
      gender: form.gender,
    } satisfies ResultState;

    setResult(nextResult);
    const nextPath = buildElementSharePath(
      nextResult.gender,
      `${nextResult.dayStemLabel}${nextResult.genderSuffix}`,
    );
    window.history.replaceState(null, "", nextPath);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-4 py-10 text-white">
      {KAKAO_JAVASCRIPT_KEY ? (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
          strategy="afterInteractive"
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-90px] top-[-90px] h-[280px] w-[280px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-90px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_42%)]" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200/80">
            무료 확인
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            나는 무슨 일간일까?
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            성별과 생년월일을 입력하면 나의 일간을 바로 확인할 수 있어요.
          </p>

          <form className="mt-7 space-y-5" onSubmit={onSubmit}>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-white/80">
                성별
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["male", "남자"],
                  ["female", "여자"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex h-12 cursor-pointer items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                      form.gender === value
                        ? "border-fuchsia-300 bg-fuchsia-400/20 text-white"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-fuchsia-300/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={form.gender === value}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          gender: value as Gender,
                        }))
                      }
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/80">
                생년월일
              </span>
              <input
                type="date"
                value={form.birthdate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, birthdate: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-white/15 bg-[#160d20] px-4 text-sm text-white outline-none transition [color-scheme:dark] focus:border-fuchsia-300"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/80">
                태어난 시간
              </span>
              <select
                value={form.birthtime}
                disabled={form.birthtimeUnknown}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, birthtime: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-white/15 bg-[#160d20] px-4 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-45 focus:border-fuchsia-300"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.birthtimeUnknown}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    birthtimeUnknown: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-white/10 accent-fuchsia-400"
              />
              태어난 시간 모름
            </label>

            {error ? (
              <p className="text-sm text-rose-200/90" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-bold text-white shadow-[0_14px_45px_rgba(217,70,239,0.36)] transition hover:scale-[1.01]"
            >
              내 일간 확인하기
            </button>
          </form>

          {result ? (
            <section className="mt-7 rounded-3xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-5 text-center">
              <p className="text-xs font-medium text-fuchsia-100/75">
                생년월일 기준으로 계산한 나의 일간
              </p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                당신은 {result.dayStemLabel}
                {result.genderSuffix}입니다
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={shareToKakao}
                  className="rounded-2xl border border-yellow-200/40 bg-yellow-300 px-3 py-3 text-sm font-bold text-[#221600] shadow-[0_10px_28px_rgba(250,204,21,0.18)] transition hover:brightness-105"
                >
                  카카오톡 공유
                </button>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  링크 복사
                </button>
              </div>
              {toast ? (
                <p className="mt-3 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100">
                  {toast}
                </p>
              ) : null}
              <Link
                href={resultHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-bold text-[#1a0a16] transition hover:bg-fuchsia-50"
              >
                내 연애 성향 자세히 보기
              </Link>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
