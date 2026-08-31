import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "서비스 약관 | 미스터 타로",
  description: "미스터 타로 서비스 이용 약관입니다.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="MR. TAROT" title="서비스 약관" updatedAt="2026년 9월 1일">
      <LegalSection title="1. 서비스의 성격">
        <p>미스터 타로는 세 장의 카드를 통해 생각을 정리할 수 있도록 돕는 엔터테인먼트 서비스입니다. 리딩은 의료, 법률, 재무 또는 그 밖의 전문적인 조언을 대신하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="2. 이용 방법">
        <p>이용자는 질문을 입력하거나 질문 없이 세 장의 카드를 직접 고를 수 있습니다. 결과는 참고를 위한 해석이며, 중요한 결정은 이용자 자신의 판단과 필요한 전문가의 조언을 함께 고려해야 합니다.</p>
      </LegalSection>

      <LegalSection title="3. 공유와 제휴 링크">
        <p>공유 기능은 선택한 세 카드와 짧은 결과 문장을 공유합니다. 질문 원문은 공유하지 않습니다.</p>
        <p>표시되는 쿠팡 파트너스 링크는 선택 사항입니다. 링크 클릭이나 구매는 결과 열람의 조건이 아닙니다.</p>
      </LegalSection>

      <LegalSection title="4. 약관 변경과 문의">
        <p>운영상 필요한 경우 약관을 변경할 수 있으며, 변경 내용은 이 페이지에 게시합니다. 문의는 <a className="text-[#d3aa68] underline underline-offset-4" href="mailto:joel610@naver.com">joel610@naver.com</a>으로 보내주세요.</p>
      </LegalSection>
    </LegalPage>
  );
}
