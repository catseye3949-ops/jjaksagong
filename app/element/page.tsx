import type { Metadata } from "next";
import ElementClient from "./ElementClient";

export const metadata: Metadata = {
  title: "나는 무슨 일간일까? | 짝사공",
  description:
    "생년월일로 갑목, 을목, 병화, 정화 등 나의 일간을 무료로 확인해보세요.",
  alternates: {
    canonical: "/element",
  },
  openGraph: {
    title: "나는 무슨 일간일까? | 짝사공",
    description:
      "생년월일로 갑목, 을목, 병화, 정화 등 나의 일간을 무료로 확인해보세요.",
    url: "/element",
  },
};

export default function ElementPage() {
  return <ElementClient />;
}
