import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "사용자 데이터 삭제 안내 | 미스터 타로",
  description: "미스터 타로의 사용자 데이터 삭제 안내입니다.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage eyebrow="MR. TAROT" title="사용자 데이터 삭제 안내" updatedAt="2026년 9월 1일">
      <LegalSection title="저장하는 사용자 데이터">
        <p>미스터 타로는 회원 계정이나 개인 프로필을 만들지 않습니다. 타로 질문은 현재 리딩을 만드는 동안에만 사용하며 서버에 저장하지 않습니다.</p>
        <p>공유 링크에는 질문이나 개인 식별 정보가 들어가지 않습니다.</p>
      </LegalSection>

      <LegalSection title="삭제 요청 방법">
        <p>서비스 이용과 관련해 삭제 또는 확인이 필요한 정보가 있다고 생각되면, <a className="text-[#d3aa68] underline underline-offset-4" href="mailto:joel610@naver.com?subject=%EB%AF%B8%EC%8A%A4%ED%84%B0%20%ED%83%80%EB%A1%9C%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD">joel610@naver.com</a>으로 요청해 주세요.</p>
        <p>요청 내용을 확인한 뒤, 서비스에 실제로 보관된 정보가 있다면 법령상 보관 의무가 없는 범위에서 삭제하거나 처리 결과를 안내합니다.</p>
      </LegalSection>
    </LegalPage>
  );
}
