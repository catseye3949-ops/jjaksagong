"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import { compressPartnerPhotoFile } from "@/lib/image/compressPartnerPhoto";
import { STORAGE_PENDING_PARTNER_PHOTO_KEY } from "@/lib/storage/keys";

type FormState = {
  name: string;
  birthdate: string;
  birthtime: string;
  gender: string;
};

type MainTab = "strategy" | "compatibility";

export default function MainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MainTab>("strategy");
  const [form, setForm] = useState<FormState>({
    name: "",
    birthdate: "",
    birthtime: "",
    gender: "",
  });
  const [birthDateParts, setBirthDateParts] = useState({
    year: "",
    month: "",
    day: "",
  });
  const [isBirthtimeUnknown, setIsBirthtimeUnknown] = useState(false);
  const [isMobileGenderOpen, setIsMobileGenderOpen] = useState(false);
  const [partnerPhotoDataUrl, setPartnerPhotoDataUrl] = useState<
    string | null
  >(null);
  const [partnerPhotoError, setPartnerPhotoError] = useState<string | null>(
    null,
  );
  const mobileMonthRef = useRef<HTMLInputElement>(null);
  const mobileDayRef = useRef<HTMLInputElement>(null);
  const pcMonthRef = useRef<HTMLInputElement>(null);
  const pcDayRef = useRef<HTMLInputElement>(null);

  const buildBirthdate = (parts: {
    year: string;
    month: string;
    day: string;
  }) => {
    if (
      parts.year.length === 4 &&
      parts.month.length >= 1 &&
      parts.day.length >= 1
    ) {
      const pad = (numText: string) => numText.padStart(2, "0");
      return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
    }
    return "";
  };

  const handleBirthPartChange =
    (
      part: "year" | "month" | "day",
      maxLength: number,
      nextRef?: React.RefObject<HTMLInputElement | null>
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = e.target.value.replace(/\D/g, "").slice(0, maxLength);

      setBirthDateParts((prev) => {
        const nextParts = { ...prev, [part]: numericValue };
        setForm((prevForm) => ({
          ...prevForm,
          birthdate: buildBirthdate(nextParts),
        }));
        return nextParts;
      });

      if (nextRef && numericValue.length === maxLength) {
        nextRef.current?.focus();
      }
    };

  const handleBirthtimeUnknown = () => {
    setIsBirthtimeUnknown(true);
    setForm((prev) => ({ ...prev, birthtime: "" }));
  };

  const handleMobileGenderSelect = (value: "" | "male" | "female") => {
    setForm((prev) => ({ ...prev, gender: value }));
    setIsMobileGenderOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    if (id === "birthtime" && value) {
      setIsBirthtimeUnknown(false);
    }
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const mobileGenderLabel =
    form.gender === "female"
      ? "여성"
      : form.gender === "male"
        ? "남성"
        : "성별을 선택해 주세요";

  const handlePartnerPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPartnerPhotoError(null);
    const result = await compressPartnerPhotoFile(file);
    if (!result.ok) {
      setPartnerPhotoError(result.error);
      setPartnerPhotoDataUrl(null);
      return;
    }
    setPartnerPhotoDataUrl(result.dataUrl);
  };

  const clearPartnerPhoto = () => {
    setPartnerPhotoDataUrl(null);
    setPartnerPhotoError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedBirthdate = buildBirthdate(birthDateParts) || form.birthdate;

    if (!normalizedBirthdate) {
      alert("생년월일을 입력해주세요.");
      return;
    }
    if (!form.gender) {
      alert("성별을 입력해주세요.");
      return;
    }

    try {
      if (partnerPhotoDataUrl) {
        sessionStorage.setItem(
          STORAGE_PENDING_PARTNER_PHOTO_KEY,
          partnerPhotoDataUrl,
        );
      } else {
        sessionStorage.removeItem(STORAGE_PENDING_PARTNER_PHOTO_KEY);
      }
    } catch {
      /* quota / private mode */
    }

    const query = new URLSearchParams({
      birthdate: normalizedBirthdate,
      birthtime: form.birthtime,
      gender: form.gender,
    });
    const trimmedName = form.name.trim();
    if (trimmedName) {
      query.set("name", trimmedName);
      query.set("targetName", trimmedName);
    }

    router.push(`/result?${query.toString()}`);
  };

  return (
    <main className="min-h-screen">
      <section className="block md:hidden">
        <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-[-80px] h-[280px] w-[280px] rounded-full bg-[#ff1f8e]/20 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-80px] h-[300px] w-[300px] rounded-full bg-[#6d2fff]/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_45%)]" />
          </div>

          <div className="relative mx-auto min-h-screen w-full max-w-[430px] border-x border-white/10 bg-gradient-to-b from-[#1a0a16] via-[#170a1f] to-[#10091a] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#130a19]/90 px-5 py-4 backdrop-blur-xl">
              <h1 className="text-center text-sm font-semibold tracking-wide text-white/95">
                분석 시작
              </h1>
            </header>

            <section className="px-5 pb-28 pt-4">
              <div
                className="mb-4 flex gap-1 rounded-2xl border border-white/15 bg-white/5 p-1"
                role="tablist"
                aria-label="입력 방식"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "strategy"}
                  onClick={() => setActiveTab("strategy")}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === "strategy"
                      ? "bg-white text-slate-900"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  상대 성향 보기
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "compatibility"}
                  onClick={() => setActiveTab("compatibility")}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === "compatibility"
                      ? "bg-white text-slate-900"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  궁합 보기
                </button>
              </div>

              {activeTab === "compatibility" ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="mb-4">
                    <p className="text-xs font-medium text-violet-200">
                      참고용 궁합 흐름
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                      두 사람의 생년월일 입력
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      생년월일을 기준으로 궁합 흐름을 참고용으로 확인할 수 있습니다.
                      이후 단계에서 상대방 성향·접근 방식을 이어서 확인할 수
                      있습니다.
                    </p>
                  </div>
                  <CompatibilityPanel />
                </div>
              ) : null}

              {activeTab === "strategy" ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="mb-5">
                    <p className="text-xs font-medium text-violet-200">
                      무료 분석 시작
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                      인연의 데이터
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      출생 시간을 모르면 입력하지 않아도 됩니다. 결과는 일주
                      중심으로 제공됩니다.
                    </p>
                  </div>

                  <form
                    id="mobile-strategy-form"
                    className="space-y-4 pb-28"
                    onSubmit={handleSubmit}
                  >
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-white/85"
                      >
                        상대 이름 또는 별명
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="예: 김유경"
                        className="h-[52px] w-full rounded-2xl border border-white/20 bg-[#1a1024] px-4 text-white outline-none transition focus:border-fuchsia-300"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="partner-photo-mobile"
                        className="mb-2 block text-sm font-medium text-white/85"
                      >
                        상대 사진 <span className="text-white/45">(선택)</span>
                      </label>
                      <input
                        id="partner-photo-mobile"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handlePartnerPhotoChange}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="partner-photo-mobile"
                          className="inline-flex cursor-pointer rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-fuchsia-300/50"
                        >
                          사진 선택
                        </label>
                        {partnerPhotoDataUrl ? (
                          <>
                            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-fuchsia-300/35">
                              <img
                                src={partnerPhotoDataUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={clearPartnerPhoto}
                              className="text-xs text-white/55 underline-offset-4 hover:text-white/85 hover:underline"
                            >
                              사진 제거
                            </button>
                          </>
                        ) : null}
                      </div>
                      {partnerPhotoError ? (
                        <p className="mt-2 text-xs text-rose-300/90">
                          {partnerPhotoError}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="birthdate"
                        className="mb-2 block text-sm font-medium text-white/85"
                      >
                        생년월일
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          id="birthyear-mobile"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={birthDateParts.year}
                          onChange={handleBirthPartChange(
                            "year",
                            4,
                            mobileMonthRef
                          )}
                          placeholder="YYYY"
                          className="h-[52px] w-full rounded-2xl border border-white/20 bg-[#1a1024] px-3 text-white outline-none transition focus:border-fuchsia-300"
                        />
                        <input
                          id="birthmonth-mobile"
                          ref={mobileMonthRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={birthDateParts.month}
                          onChange={handleBirthPartChange("month", 2, mobileDayRef)}
                          placeholder="MM"
                          className="h-[52px] w-full rounded-2xl border border-white/20 bg-[#1a1024] px-3 text-white outline-none transition focus:border-fuchsia-300"
                        />
                        <input
                          id="birthday-mobile"
                          ref={mobileDayRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={birthDateParts.day}
                          onChange={handleBirthPartChange("day", 2)}
                          placeholder="DD"
                          className="h-[52px] w-full rounded-2xl border border-white/20 bg-[#1a1024] px-3 text-white outline-none transition focus:border-fuchsia-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="birthtime"
                        className="mb-2 block text-sm font-medium text-white/85"
                      >
                        출생 시간 <span className="text-white/45">(선택)</span>
                      </label>
                      <input
                        id="birthtime"
                        type="time"
                        value={form.birthtime}
                        onChange={handleChange}
                        className="h-[52px] w-full rounded-2xl border border-white/20 bg-[#1a1024] px-4 text-white outline-none transition focus:border-fuchsia-300"
                      />
                      <button
                        type="button"
                        onClick={handleBirthtimeUnknown}
                        className={`mt-2 inline-flex rounded-xl border px-3 py-2 text-xs font-medium transition ${
                          isBirthtimeUnknown
                            ? "border-fuchsia-300/80 bg-fuchsia-400/15 text-fuchsia-100"
                            : "border-white/20 bg-white/5 text-white/70 hover:text-white"
                        }`}
                      >
                        출생시간 모름
                      </button>
                      <p className="mt-2 text-xs text-white/55">
                        모르면 선택하지 않아도 분석할 수 있어요.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="gender"
                        className="mb-2 block text-sm font-medium text-white/85"
                      >
                        성별 <span className="text-rose-300">*</span>
                      </label>
                      <div className="relative">
                        <button
                          id="gender"
                          type="button"
                          onClick={() => setIsMobileGenderOpen((prev) => !prev)}
                          className={`flex h-[52px] w-full items-center justify-between rounded-2xl border border-white/20 bg-[#1a1024] px-4 text-left outline-none transition ${
                            form.gender ? "text-white" : "text-white/55"
                          }`}
                        >
                          <span>{mobileGenderLabel}</span>
                          <span className="text-white/60">
                            {isMobileGenderOpen ? "▲" : "▼"}
                          </span>
                        </button>

                        {isMobileGenderOpen ? (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-black shadow-xl">
                            <button
                              type="button"
                              onClick={() => handleMobileGenderSelect("")}
                              className={`block w-full px-4 py-3 text-left text-sm ${
                                form.gender === "" ? "bg-slate-100 font-medium" : ""
                              }`}
                            >
                              성별을 선택해 주세요
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMobileGenderSelect("male")}
                              className={`block w-full px-4 py-3 text-left text-sm ${
                                form.gender === "male"
                                  ? "bg-pink-50 font-medium text-pink-600"
                                  : ""
                              }`}
                            >
                              남성
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMobileGenderSelect("female")}
                              className={`block w-full px-4 py-3 text-left text-sm ${
                                form.gender === "female"
                                  ? "bg-pink-50 font-medium text-pink-600"
                                  : ""
                              }`}
                            >
                              여성
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}
            </section>

            {activeTab === "strategy" ? (
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
                <div className="pointer-events-auto w-full max-w-[430px] border-t border-white/10 bg-[#130a19]/95 px-5 py-4 backdrop-blur-xl">
                  <button
                    type="submit"
                    form="mobile-strategy-form"
                    className="w-full rounded-2xl bg-gradient-to-r from-[#ff2a9b] via-[#ff1f86] to-[#d3005f] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(255,31,134,0.45)]"
                  >
                    무료 결과 보기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hidden md:block">
        <div className="min-h-screen bg-gradient-to-b from-white via-violet-50 to-pink-50 px-6 py-16 text-slate-900">
          <section className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <div className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
                짝사공 분석 시작
              </div>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                상대 생년월일을 입력하고
                <br />
                연애 성향을 확인해보세요
              </h1>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-violet-100 ring-1 ring-slate-200 md:p-8">
              <div
                className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1"
                role="tablist"
                aria-label="입력 방식"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "strategy"}
                  onClick={() => setActiveTab("strategy")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:text-base ${
                    activeTab === "strategy"
                      ? "bg-white text-violet-800 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  상대 성향 보기
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "compatibility"}
                  onClick={() => setActiveTab("compatibility")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:text-base ${
                    activeTab === "compatibility"
                      ? "bg-white text-violet-800 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  궁합 보기
                </button>
              </div>

              {activeTab === "compatibility" ? (
                <div>
                  <div className="mb-6">
                    <p className="text-sm font-medium text-violet-600">
                      참고용 궁합 흐름
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      두 사람의 생년월일 입력
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      생년월일을 기준으로 궁합 흐름을 참고용으로 확인할 수 있습니다.
                      이후 단계에서 상대방 성향·접근 방식을 이어서 확인할 수
                      있습니다.
                    </p>
                  </div>
                  <CompatibilityPanel />
                </div>
              ) : null}

              {activeTab === "strategy" ? (
                <>
                  <div className="mb-6">
                    <p className="text-sm font-medium text-violet-600">
                      무료 분석 시작
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      인연의 데이터
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      출생 시간을 모르면 입력하지 않아도 됩니다. 결과는 일주
                      중심으로 제공됩니다.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        상대 이름 또는 별명
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="예: 김유경"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="partner-photo-pc"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        상대 사진 <span className="text-slate-400">(선택)</span>
                      </label>
                      <input
                        id="partner-photo-pc"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handlePartnerPhotoChange}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="partner-photo-pc"
                          className="inline-flex cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-violet-400"
                        >
                          사진 선택
                        </label>
                        {partnerPhotoDataUrl ? (
                          <>
                            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-violet-200">
                              <img
                                src={partnerPhotoDataUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={clearPartnerPhoto}
                              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                            >
                              사진 제거
                            </button>
                          </>
                        ) : null}
                      </div>
                      {partnerPhotoError ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {partnerPhotoError}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="birthdate"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        생년월일
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          id="birthyear-pc"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={birthDateParts.year}
                          onChange={handleBirthPartChange("year", 4, pcMonthRef)}
                          placeholder="YYYY"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                        />
                        <input
                          id="birthmonth-pc"
                          ref={pcMonthRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={birthDateParts.month}
                          onChange={handleBirthPartChange("month", 2, pcDayRef)}
                          placeholder="MM"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                        />
                        <input
                          id="birthday-pc"
                          ref={pcDayRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={birthDateParts.day}
                          onChange={handleBirthPartChange("day", 2)}
                          placeholder="DD"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="birthtime"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        출생 시간 <span className="text-slate-400">(선택)</span>
                      </label>
                      <input
                        id="birthtime"
                        type="time"
                        value={form.birthtime}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={handleBirthtimeUnknown}
                        className={`mt-2 inline-flex rounded-xl border px-3 py-2 text-xs font-medium transition ${
                          isBirthtimeUnknown
                            ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700"
                            : "border-slate-300 bg-white text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        출생시간 모름
                      </button>
                      <p className="mt-2 text-xs text-slate-500">
                        모르면 선택하지 않아도 분석할 수 있어요.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="gender"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        성별 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-violet-500"
                      >
                        <option className="text-black/50" value="">
                          성별을 선택해주세요
                        </option>
                        <option className="text-black" value="female">
                          여성
                        </option>
                        <option className="text-black" value="male">
                          남성
                        </option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
                    >
                      무료 결과 보기
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}