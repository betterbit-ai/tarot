import { getEditorialCardMeaning } from "@/domain/tarot/interpretation-v2";
import { getTarotCard } from "@/domain/tarot/cards";
import type { ContentFormat, ContentQueue, ContentTopic, ThreadsContent, ThreadsReadingSet } from "./types";

type TopicPlan = { topic: ContentTopic; count: number };

const TOPIC_PLAN: readonly TopicPlan[] = [
  { topic: "LOVE", count: 37 },
  { topic: "GENERAL", count: 26 },
  { topic: "CAREER", count: 16 },
  { topic: "MONEY", count: 11 },
  { topic: "DECISION", count: 10 },
  { topic: "EXPERIMENTAL", count: 5 },
];

const TOPIC_FORMATS: Record<ContentTopic, readonly ContentFormat[]> = {
  LOVE: ["PICK_3", "YES_NO_NOT_YET", "LOVE"],
  GENERAL: ["PICK_3", "YES_NO_NOT_YET"],
  CAREER: ["PICK_3", "YES_NO_NOT_YET", "CAREER"],
  MONEY: ["PICK_3", "YES_NO_NOT_YET", "MONEY"],
  DECISION: ["YES_NO_NOT_YET", "PICK_3"],
  EXPERIMENTAL: ["PICK_3"],
};

const CTA = "세 장을 직접 고르고 싶다면 프로필의 미스터 타로에서 이어서 봐요.";
const PILOT_START_ID = 47;

type CommercePilotTemplate = {
  topic: ContentTopic;
  hook: string;
  promise: string;
  sets: [ThreadsReadingSet, ThreadsReadingSet, ThreadsReadingSet];
};

const COMMERCE_PILOT: readonly CommercePilotTemplate[] = [
  {
    topic: "MONEY",
    hook: "월급이 들어온 지 3일도 안 됐는데 잔액을 다시 확인했다면.",
    promise: "이번 달 돈의 흐름이 바뀌는 지점을 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "루비", cardIds: [62, 66, 64], reading: "먼저 끊어야 할 지출이나 거래가 하나 보여요. 손해인 줄 알면서 관계 때문에 유지한 것을 정리하면, 그 자리에 실무적으로 도움을 주는 사람이나 새 일이 들어올 수 있어요.", signal: "새 계약, 부수입 제안, 환급처럼 금액이 분명한 소식이 신호예요.", action: "이번 주에는 자동결제와 반복 지출부터 확인하세요.", affiliateTheme: "organization", productReason: "돈이 어디에서 새는지 눈에 보이게 정리하는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "사파이어", cardIds: [65, 11, 61], reading: "여러 비용을 돌려가며 맞추던 흐름이 문서 하나로 정리될 수 있어요. 계약, 정산, 환불, 지원금처럼 확인을 기다리던 일이 생각보다 빠르게 움직일 가능성이 있습니다.", signal: "다시 제출해 달라거나 확인이 끝났다는 연락이 신호예요.", action: "기다리기만 하지 말고 누락된 서류와 신청 상태를 먼저 확인하세요.", affiliateTheme: "organization", productReason: "영수증과 계약 서류를 한곳에 모아 확인하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "에메랄드", cardIds: [42, 67, 7], reading: "하고 싶은 일이 많아 돈과 시간이 여러 방향으로 흩어져 있어요. 이번 변화는 횡재보다 한 가지 목표에 자원을 모으면서 시작됩니다.", signal: "제안이나 선택지가 두세 개 겹쳐 들어오는 때가 신호예요.", action: "가장 빨리 수입으로 이어질 목표 하나만 이번 달 계획에 남기세요.", affiliateTheme: "new-start", productReason: "한 달의 목표를 한눈에 정리하고 계속 확인하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "GENERAL",
    hook: "새벽 2시에 불을 끄고도 같은 걱정을 다시 검색했다면.",
    promise: "지금 필요한 휴식이 어떤 모양인지 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "달", cardIds: [58, 53, 17], reading: "아직 일어나지 않은 일까지 머릿속에서 반복하고 있어요. 지금은 답을 더 찾기보다 생각을 멈출 시간을 확보해야 다시 판단력이 돌아옵니다.", signal: "아침에 눈을 떴을 때 어젯밤보다 문제가 작게 느껴지는 순간이 신호예요.", action: "잠들기 30분 전에는 화면과 검색을 함께 멈추세요.", affiliateTheme: "rest", productReason: "빛을 줄이고 잠들기 전 생각을 끊는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "별", cardIds: [31, 14, 48], reading: "내 몫이 아닌 책임까지 들고 버틴 흔적이 보여요. 하루를 완전히 비우기 어렵다면, 사람을 돌보는 시간과 나를 돌보는 시간을 분리하는 것부터 시작해야 합니다.", signal: "부탁 하나를 미루거나 거절했는데도 관계가 무너지지 않는 경험이 신호예요.", action: "오늘 일정에서 남을 위한 일 하나를 덜어내세요.", affiliateTheme: "rest", productReason: "짧게라도 빛을 줄이고 혼자 쉬는 시간을 만들기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "구름", cardIds: [18, 9, 19], reading: "정보가 부족해서 불안한데, 계속 확인할수록 마음만 더 흐려지는 상태예요. 혼자 조용히 생각을 정리하면 예상보다 단순한 답이 드러날 수 있습니다.", signal: "누군가의 말보다 내가 확인한 사실 한 가지가 더 중요해지는 순간이 신호예요.", action: "오늘은 새로운 검색 대신 이미 아는 사실 세 가지만 적어보세요.", affiliateTheme: "rest", productReason: "잠깐 화면을 덮고 조용한 시간을 만들기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "CAREER",
    hook: "오전 9시부터 같은 문장을 5번 고치고도 일을 시작하지 못했다면.",
    promise: "집중을 되찾는 첫 지점을 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "열쇠", cardIds: [57, 50, 71], reading: "능력이 없어서가 아니라 시작 기준이 너무 높아서 손이 묶여 있어요. 해야 할 일을 한 문장으로 줄이면, 반복하면서 완성도를 올릴 힘이 다시 생깁니다.", signal: "막연했던 일이 30분 안에 끝낼 수 있는 단위로 보이기 시작하는 순간이 신호예요.", action: "완성본 대신 가장 작은 초안부터 만드세요.", affiliateTheme: "focus", productReason: "지금 할 일만 남기고 작업 공간을 정리하는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "계단", cardIds: [26, 63, 66], reading: "여러 사람의 말이 겹쳐 우선순위가 흐려졌어요. 누구의 의견이 맞는지 따지기보다 완료 기준을 먼저 세우면 협업이 다시 움직일 수 있습니다.", signal: "회의 뒤에 담당자와 마감일이 한 문장으로 정리되는 순간이 신호예요.", action: "다음 대화에서는 해야 할 일과 끝나는 조건을 먼저 확인하세요.", affiliateTheme: "organization", productReason: "흩어진 메모와 자료를 한곳에 모으기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "나침반", cardIds: [39, 22, 7], reading: "지루함이 길어졌지만 일 자체를 포기한 것은 아니에요. 곧 마음을 다시 움직이게 하는 작은 제안이나 아이디어가 들어올 수 있습니다.", signal: "미뤄둔 일을 갑자기 오늘 끝내고 싶어지는 순간이 신호예요.", action: "의욕이 생기면 준비부터 하지 말고 첫 작업을 20분만 바로 시작하세요.", affiliateTheme: "focus", productReason: "짧은 집중 시간을 지키고 산만함을 줄이는 데 도움이 되는 상품을 골랐어요." },
    ],
  },
  {
    topic: "DECISION",
    hook: "6개월째 시작할 날짜만 바꾸고 있다면 이번에는 이유가 보여요.",
    promise: "새 출발을 막는 것과 먼저 움직일 지점을 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "문", cardIds: [59, 13, 0], reading: "이미 끝난 선택을 마음속에서 계속 연장하고 있어요. 미련을 정리하는 순간 빈자리가 생기고, 예상보다 가볍게 새로운 방향을 시험할 수 있습니다.", signal: "예전 계획을 설명하지 않아도 마음이 편해지는 순간이 신호예요.", action: "끝낸 일 하나를 목록에서 완전히 지우고 새 계획은 일주일만 시험하세요.", affiliateTheme: "new-start", productReason: "새 계획을 부담 없이 기록하고 일주일씩 점검하기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "배", cardIds: [12, 14, 29], reading: "지금의 멈춤은 실패가 아니라 조건을 맞추는 시간에 가까워요. 일정과 체력을 조정하고 나면 오래 기다린 일이 한꺼번에 빠르게 움직일 수 있습니다.", signal: "서로 맞지 않던 일정이 갑자기 한 날짜로 모이는 순간이 신호예요.", action: "시작 날짜보다 시작 전에 갖춰야 할 조건 세 가지를 적어두세요.", affiliateTheme: "new-start", productReason: "준비 조건과 일정을 함께 정리하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "길", cardIds: [23, 21, 74], reading: "멀리 보는 계획은 이미 충분히 세웠어요. 이제는 이전 단계를 마무리하고, 모르는 것을 배우는 사람의 자세로 첫 결과물을 만들어야 합니다.", signal: "완벽한 기회보다 작지만 구체적인 제안이 먼저 들어오는 것이 신호예요.", action: "오늘 배워야 할 한 가지와 이번 주에 만들 결과 하나를 정하세요.", affiliateTheme: "focus", productReason: "배울 내용과 첫 결과물을 나누어 정리하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "MONEY",
    hook: "카드 명세서에서 기억나지 않는 결제 2개를 발견했다면.",
    promise: "새는 돈을 멈추고 다시 채우는 순서를 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "동전", cardIds: [68, 69, 64], reading: "부족한 상황을 혼자 숨기느라 받을 수 있는 도움까지 놓치고 있어요. 정당한 지원이나 정산을 요청하면 작은 금액부터 흐름이 다시 열릴 수 있습니다.", signal: "환급, 포인트, 미지급금처럼 잊고 있던 금액이 확인되는 순간이 신호예요.", action: "이번 주 안에 받을 수 있는 혜택과 미정산 내역을 확인하세요.", affiliateTheme: "organization", productReason: "작은 수입과 지출도 빠뜨리지 않고 기록하기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "저울", cardIds: [54, 62, 77], reading: "돈이 오가는 관계에서 이기고 지는 문제에 너무 오래 머물렀어요. 손해를 만든 거래를 냉정하게 정리해야 내 몫을 지킬 수 있는 안정적인 흐름이 생깁니다.", signal: "조건을 다시 정하자는 제안이나 거래 종료 이야기가 나오는 때가 신호예요.", action: "감정이 아니라 금액과 조건을 적어 손익을 다시 계산하세요.", affiliateTheme: "organization", productReason: "거래 조건과 금액을 나누어 보관하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "열매", cardIds: [70, 10, 72], reading: "당장 결과가 보이지 않아도 지금까지 쌓은 것이 사라진 것은 아니에요. 기다리던 흐름이 바뀌면서 남의 도움보다 내 실력으로 버는 돈이 늘어날 수 있습니다.", signal: "예전에 보낸 제안이나 지원에서 다시 연락이 오는 순간이 신호예요.", action: "새 일을 벌이기 전에 이미 심어둔 일 세 곳에 후속 연락을 보내세요.", affiliateTheme: "focus", productReason: "진행 중인 일과 후속 연락을 놓치지 않게 정리하는 데 도움이 되는 상품을 골랐어요." },
    ],
  },
  {
    topic: "GENERAL",
    hook: "밤 12시가 지나도 침대에서 화면을 40분째 넘기고 있다면.",
    promise: "몸보다 늦게 멈추는 마음을 어떻게 쉬게 할지 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "촛불", cardIds: [40, 41, 19], reading: "지나간 일의 아쉬움 때문에 지금 남아 있는 좋은 것까지 보지 못하고 있어요. 익숙하고 편한 사람과 시간을 보내면 마음이 빠르게 밝아질 수 있습니다.", signal: "별일 아닌 대화에서 오랜만에 웃음이 나오는 순간이 신호예요.", action: "오늘은 혼자 해결하려 하지 말고 편한 사람에게 먼저 안부를 보내세요.", affiliateTheme: "rest", productReason: "대화를 마친 뒤 긴장을 풀고 조용히 쉬는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "파도", cardIds: [15, 18, 53], reading: "피곤할수록 화면과 생각을 더 놓지 못하는 반복에 들어가 있어요. 불안을 없애려 하기보다 자극을 먼저 끊어야 몸이 실제로 쉴 수 있습니다.", signal: "확인하지 않은 알림을 남겨두고도 잠들 수 있는 밤이 신호예요.", action: "충전기를 침대에서 손이 닿지 않는 곳으로 옮기세요.", affiliateTheme: "rest", productReason: "빛과 자극을 줄여 잠드는 환경을 만드는 데 도움이 되는 상품을 골랐어요." },
      { key: "C", symbol: "샘", cardIds: [52, 48, 14], reading: "상처받은 마음을 괜찮은 척 다루느라 더 지친 상태예요. 감정을 바로 결론 내리지 않고 천천히 받아들이면 생활 리듬도 함께 돌아옵니다.", signal: "그 일을 떠올려도 몸에 먼저 힘이 들어가지 않는 순간이 신호예요.", action: "오늘 느낀 감정을 설명하지 말고 단어 세 개로만 적어보세요.", affiliateTheme: "new-start", productReason: "짧게 감정과 하루를 기록하고 다음 날과 분리하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "CAREER",
    hook: "25분 동안 탭만 8개 열고 정작 첫 작업은 시작하지 못했다면.",
    promise: "정보를 줄이고 결과를 만드는 순서를 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "펜", cardIds: [60, 56, 63], reading: "정보를 더 모으는 일이 준비가 아니라 회피가 되어가고 있어요. 필요한 것과 숨고 싶은 이유를 구분하면 결정은 훨씬 단순해집니다.", signal: "자료 하나를 닫았는데도 다음 행동이 분명하게 보이는 순간이 신호예요.", action: "오늘 결과에 꼭 필요한 탭 세 개만 남기세요.", affiliateTheme: "focus", productReason: "책상 위 시선을 분산시키는 물건을 줄이는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "책", cardIds: [46, 42, 71], reading: "좋아 보이는 아이디어는 많지만 아직 손에 익은 것은 적어요. 하나를 고른 뒤 반복해서 만들어야 가능성이 실제 실력으로 바뀝니다.", signal: "새 아이디어보다 어제 하던 일을 다시 개선하고 싶어지는 순간이 신호예요.", action: "이번 주에는 새 강의를 찾지 말고 같은 작업을 세 번 반복하세요.", affiliateTheme: "focus", productReason: "반복할 작업과 진행 횟수를 눈에 보이게 관리하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "방패", cardIds: [28, 30, 8], reading: "계속 방어하며 버틴 탓에 작은 요청도 공격처럼 느껴질 수 있어요. 힘으로 밀어붙이기보다 지킬 기준 하나만 정하면 소모가 줄어듭니다.", signal: "설명하지 않아도 되는 일을 구분할 수 있게 되는 순간이 신호예요.", action: "오늘 꼭 지킬 기준 하나와 양보해도 되는 것 하나를 나누세요.", affiliateTheme: "organization", productReason: "해야 할 일과 미뤄도 되는 일을 분리해 정리하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "DECISION",
    hook: "3개월 전 저장한 계획표를 오늘 다시 열었다면 시작점이 보여요.",
    promise: "이번에는 무엇을 버리고 어디서 다시 시작할지 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "번개", cardIds: [16, 17, 22], reading: "예상하지 못한 변화가 기존 계획을 흔들 수 있어요. 하지만 무너진 자리를 정리하고 나면 오히려 하고 싶었던 일을 시작할 공간이 생깁니다.", signal: "취소나 변경 소식 뒤에 새로운 제안이 바로 이어지는 것이 신호예요.", action: "원래 계획을 복구하려 하기보다 지금 가능한 첫 행동을 정하세요.", affiliateTheme: "new-start", productReason: "바뀐 계획을 처음부터 다시 정리하기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "다리", cardIds: [43, 55, 21], reading: "익숙하지만 더는 맞지 않는 자리에서 마음이 먼저 떠나고 있어요. 크게 싸우지 않아도 자연스럽게 환경을 옮기며 한 단계를 마칠 수 있습니다.", signal: "떠날 이유보다 다음에 갈 곳의 조건이 더 선명해지는 순간이 신호예요.", action: "지금 싫은 점보다 다음 환경에 꼭 필요한 조건 세 가지를 적으세요.", affiliateTheme: "new-start", productReason: "새 환경의 조건과 준비 과정을 차분히 기록하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "씨앗", cardIds: [2, 50, 74], reading: "마음속에서는 이미 방향을 알고 있지만 근거가 부족해 말하지 못하고 있어요. 작은 공부와 확인을 거치면 막연한 감이 실행할 수 있는 계획으로 바뀝니다.", signal: "배우고 싶은 분야의 구체적인 과정이나 사람이 눈에 들어오는 순간이 신호예요.", action: "결정부터 내리지 말고 이번 주에 확인할 질문 세 개를 만드세요.", affiliateTheme: "focus", productReason: "배운 내용과 다음 질문을 이어서 기록하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "MONEY",
    hook: "통장 앱을 오늘만 5번 열었다면 지켜야 할 돈부터 볼게요.",
    promise: "불안 때문에 붙잡는 돈과 실제로 지킬 몫을 세 장으로 나눠볼게요.",
    sets: [
      { key: "A", symbol: "상자", cardIds: [73, 67, 69], reading: "가족이나 생활의 책임 때문에 돈을 꽉 붙들고 있어요. 무조건 아끼는 것보다 누구와 얼마를 나눌지 기준을 세워야 내 몫도 지킬 수 있습니다.", signal: "공동비용이나 생활비 분담을 다시 이야기할 일이 생기는 것이 신호예요.", action: "함께 쓰는 돈과 혼자 지킬 돈을 계좌나 항목으로 분리하세요.", affiliateTheme: "organization", productReason: "생활비 항목을 나누고 월별 흐름을 확인하기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "나무", cardIds: [76, 70, 10], reading: "생활을 안정시키기 위해 해온 관리가 곧 효과를 보일 수 있어요. 눈에 띄는 변화가 늦더라도 꾸준히 쌓인 일이 예상하지 못한 기회와 연결됩니다.", signal: "오래 기다린 결과나 예전 인연에게서 연락이 오는 순간이 신호예요.", action: "성과가 더딘 일 하나를 정해 중단 기준과 기다릴 날짜를 함께 적으세요.", affiliateTheme: "new-start", productReason: "기다리는 일의 기한과 다음 행동을 함께 관리하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "봉투", cardIds: [61, 65, 11], reading: "급한 마음으로 여러 결제를 동시에 맞추다 보니 중요한 조건을 놓칠 수 있어요. 속도를 조금 낮추고 계약과 청구 내용을 확인하면 불필요한 지출을 막을 수 있습니다.", signal: "결제 직전 금액이나 조건이 처음 안내와 다르다는 점을 발견하는 것이 신호예요.", action: "큰 결제는 바로 승인하지 말고 총액과 해지 조건을 다시 읽으세요.", affiliateTheme: "organization", productReason: "청구서와 계약 내용을 날짜별로 보관하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "GENERAL",
    hook: "알람을 끄고도 20분 동안 몸을 일으키지 못한 아침이 이어졌다면.",
    promise: "더 버틸 때가 아니라 회복할 때인지 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "깃털", cardIds: [30, 8, 53], reading: "오래 버텨온 힘은 남아 있지만 지금 더 밀면 회복에 시간이 오래 걸려요. 끝까지 견디는 것보다 안전하게 쉬는 선택이 필요한 때입니다.", signal: "쉬어도 된다는 말을 들었을 때 안도감보다 눈물이 먼저 나는 것이 신호예요.", action: "오늘 반드시 하지 않아도 되는 일 하나를 일정에서 빼세요.", affiliateTheme: "rest", productReason: "짧은 시간이라도 빛을 차단하고 제대로 쉬는 데 도움이 되는 상품을 골랐어요." },
      { key: "B", symbol: "호수", cardIds: [58, 18, 19], reading: "밤에는 걱정이 커지고 아침에는 이유가 흐려지는 일이 반복되고 있어요. 불안의 내용보다 수면 부족이 판단을 흔들고 있을 가능성이 큽니다.", signal: "푹 잔 다음 날 같은 문제가 훨씬 단순하게 보이는 것이 신호예요.", action: "오늘만큼은 답을 내리지 말고 수면 시간을 먼저 확보하세요.", affiliateTheme: "rest", productReason: "잠드는 환경을 어둡고 단순하게 만드는 데 도움이 되는 상품을 골랐어요." },
      { key: "C", symbol: "바람", cardIds: [31, 43, 14], reading: "감당할 일이 많아졌는데도 모두 내 책임처럼 들고 있어요. 하나를 내려놓고 거리를 두면 생활 리듬이 서서히 제자리로 돌아옵니다.", signal: "하지 않겠다고 정한 뒤 오히려 숨이 편해지는 일이 신호예요.", action: "이번 주에 끝내지 않을 일 하나를 분명히 정하세요.", affiliateTheme: "new-start", productReason: "할 일과 하지 않을 일을 나누어 기록하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "CAREER",
    hook: "오후 3시만 되면 책상 위 물건부터 만지작거린다면.",
    promise: "일이 다시 앞으로 나가기 위해 필요한 조건을 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "화살", cardIds: [29, 66, 4], reading: "속도는 충분하지만 함께 일하는 기준이 정리되지 않았어요. 역할과 마감이 분명해지면 흩어진 진행이 하나의 결과로 빠르게 모일 수 있습니다.", signal: "답이 늦던 사람들이 같은 일정에 동의하는 순간이 신호예요.", action: "오늘 공유할 메시지에 담당자와 마감일을 반드시 함께 적으세요.", affiliateTheme: "organization", productReason: "업무별 자료와 담당 내용을 나누어 정리하기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "망치", cardIds: [39, 74, 71], reading: "일이 재미없어진 것이 아니라 성장하는 감각이 사라져 지친 상태예요. 작더라도 새 기술을 익혀 바로 써보면 집중이 다시 살아납니다.", signal: "배운 것을 같은 날 업무에 적용할 기회가 생기는 것이 신호예요.", action: "오늘 필요한 기술 하나만 찾아 30분 안에 결과물에 사용하세요.", affiliateTheme: "focus", productReason: "배운 내용과 적용 결과를 한곳에서 관리하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "왕관", cardIds: [26, 11, 63], reading: "의견 충돌이 계속되는 이유는 사람이 아니라 판단 기준이 다르기 때문이에요. 감정을 빼고 같은 자료를 보게 하면 결정권과 방향이 정리될 수 있습니다.", signal: "누가 맞는지보다 어떤 기준으로 정할지를 묻는 사람이 나타나는 것이 신호예요.", action: "선택 기준을 세 가지로 줄여 회의 전에 먼저 공유하세요.", affiliateTheme: "focus", productReason: "판단 기준과 비교 내용을 한눈에 정리하기 좋은 상품을 골랐어요." },
    ],
  },
  {
    topic: "DECISION",
    hook: "이번 달 달력에서 시작 날짜를 4번째 옮기고 있다면.",
    promise: "이번에는 실제로 움직이게 할 출발점을 세 장으로 볼게요.",
    sets: [
      { key: "A", symbol: "종", cardIds: [20, 0, 22], reading: "다시 해보라는 마음이 반복해서 올라오고 있어요. 예전 방식의 평가를 내려놓으면 부담이 적은 형태로 새롭게 시작할 힘이 생깁니다.", signal: "예전에 포기한 일을 다른 방식으로 제안받는 순간이 신호예요.", action: "완벽한 재도전 대신 오늘 10분 동안 할 수 있는 시작을 만드세요.", affiliateTheme: "new-start", productReason: "작은 시작을 날짜별로 기록하고 이어가기 좋은 상품을 골랐어요." },
      { key: "B", symbol: "별", cardIds: [59, 17, 64], reading: "힘든 단계는 이미 끝에 가까워요. 회복하는 동안 들어오는 작은 기회가 앞으로 이어질 현실적인 출발점이 될 수 있습니다.", signal: "한 번으로 끝날 것 같던 제안이 다음 일정이나 계약으로 이어지는 것이 신호예요.", action: "큰 성과를 기대하기보다 다음 기회를 만드는 첫 결과에 집중하세요.", affiliateTheme: "new-start", productReason: "첫 결과와 다음 일정을 이어서 계획하기 좋은 상품을 골랐어요." },
      { key: "C", symbol: "수레", cardIds: [21, 23, 7], reading: "한 단계를 마칠 준비는 끝났고 이제 방향을 정할 차례예요. 여러 가능성을 비교하는 시간을 끝내면 이동 속도가 빠르게 붙을 수 있습니다.", signal: "멀리 있던 일정이 실제 날짜와 장소로 확정되는 순간이 신호예요.", action: "선택지를 두 개 이하로 줄이고 이번 주 안에 하나를 예약하거나 신청하세요.", affiliateTheme: "focus", productReason: "결정한 일정과 준비할 일을 함께 확인하기 좋은 상품을 골랐어요." },
    ],
  },
];
function hasFinalConsonant(value: string): boolean {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 !== 0 : false;
}

function objectParticle(value: string): "을" | "를" {
  return hasFinalConsonant(value) ? "을" : "를";
}

function subjectParticle(value: string): "이" | "가" {
  return hasFinalConsonant(value) ? "이" : "가";
}

const TOPIC_HOOKS: Record<ContentTopic, readonly string[]> = {
  LOVE: [
    "밤 11시에 답장창을 열었다가 이름만 보고 닫은 적 있나요?",
    "3일째 먼저 연락할지 고민하며 같은 대화를 다시 읽고 있다면.",
    "새벽 2시에 끝난 대화를 다시 열어 마지막 문장을 확인했다면.",
    "답장을 7번 고쳐 쓰고도 보내기 버튼을 누르지 못했다면.",
    "2주 전 지운 사진을 오늘 다시 찾아봤다면.",
  ],
  GENERAL: [
    "아침 8시 알람을 끄자마자 어제 미룬 일이 떠올랐다면.",
    "5분이면 끝날 일을 오늘만 3번 뒤로 미뤘다면.",
    "밤 12시에 불을 끄고도 같은 걱정을 다시 검색했다면.",
    "10분 동안 할 일 목록 첫 줄만 썼다 지웠다면.",
    "7일째 같은 생각 때문에 잠들기 전 화면을 다시 켰다면.",
  ],
  CAREER: [
    "출근 10분 만에 채용 공고를 다시 열어본 적 있나요?",
    "점심 1시간 동안 이력서 첫 문장만 고쳐 썼다면.",
    "3개월째 퇴근길마다 그만둘 날짜를 계산하고 있다면.",
    "오전 9시 회의가 끝나자마자 다른 회사 이름을 검색했다면.",
    "이번 주만 2번 사직서를 썼다가 저장하지 않았다면.",
  ],
  MONEY: [
    "결제 버튼 앞에서 20분째 가격표만 다시 보고 있다면.",
    "월급날 3일 전인데 통장 앱을 5번 넘게 열어봤다면.",
    "10만원을 쓰기 전에 장바구니를 3번 비웠다면.",
    "밤 11시에 이번 달 카드 명세서를 다시 내려받았다면.",
    "30일 뒤 잔액이 걱정돼 오늘 살 물건을 다시 내려놓았다면.",
  ],
  DECISION: [
    "24시간 안에 답해야 하는데 메모장에 장단점만 다시 적고 있다면.",
    "같은 질문을 5번 듣고도 매번 다른 답을 했다면.",
    "3초 만에 고른 답을 1시간째 의심하고 있다면.",
    "이번 주만 4번 결정을 다음 주 달력으로 옮겼다면.",
    "딱 1번만 더 확인한 뒤 정하겠다는 말을 반복하고 있다면.",
  ],
  EXPERIMENTAL: [
    "오늘 같은 숫자를 3번 마주치고도 그냥 넘기지 못했다면.",
    "15분 전 들은 한 문장이 아직 머릿속에서 반복된다면.",
    "아침 7시에 꾼 꿈의 마지막 장면만 선명하게 남았다면.",
    "10초 안에 떠오른 단어를 지우고 다른 답을 찾고 있다면.",
    "앞으로 3일 안에 바꾸고 싶은 한 가지를 아직 적지 못했다면.",
  ],
};

const HOOK_ACTION_PATTERN = /열|닫|읽|확인|쓰|썼|누르|찾|미루|미뤘|검색|켜|끄|고치|고쳐|계산|내려|비우|놓|적|답|고르|의심|옮기|옮겼|반복|마주|듣|남|떠오르|지우|바꾸|보|잠|결제|넘기|만지작/;

export function hookQualityError(hook: string): string | null {
  if (!/\d/.test(hook)) return "hook must contain a concrete number or time";
  if (!HOOK_ACTION_PATTERN.test(hook)) return "hook must contain an observable action or scene";
  if (hook.length > 100) return "hook is longer than 100 characters";
  return null;
}

function hookFor(topic: ContentTopic, index: number): string {
  const hooks = TOPIC_HOOKS[topic];
  return hooks[index % hooks.length] ?? hooks[0];
}

function cardIdsFor(seed: number): number[] {
  // Every generated Threads post leads into Mr. Tarot's core three-card ritual.
  const count = 3;
  const start = (seed * 17 + 6) % 78;
  const step = 11 + (seed % 5) * 2;
  const ids: number[] = [];
  let candidate = start;
  while (ids.length < count) {
    if (!ids.includes(candidate)) ids.push(candidate);
    candidate = (candidate + step) % 78;
  }
  return ids;
}

function resultLine(cardId: number, topic: ContentTopic): string {
  const card = getTarotCard(cardId);
  const meaning = getEditorialCardMeaning(cardId);
  const topicLead: Record<ContentTopic, string> = {
    LOVE: "관계에서는",
    GENERAL: "지금은",
    CAREER: "일에서는",
    MONEY: "돈을 볼 때는",
    DECISION: "결정 앞에서는",
    EXPERIMENTAL: "오늘은",
  };
  const variants = [
    `${topicLead[topic]} ${meaning.light}${subjectParticle(meaning.light)} 먼저 걸려요. ${meaning.shadow}${objectParticle(meaning.shadow)} 조심하세요.`,
    `${topicLead[topic]} ${meaning.light}${objectParticle(meaning.light)} 택하는 편이 좋아요. ${meaning.shadow}에만 머물지는 마세요.`,
    `${topicLead[topic]} ${meaning.light} 쪽으로 가도 괜찮아요. 다만 ${meaning.shadow}${subjectParticle(meaning.shadow)} 커지는지 보세요.`,
  ];
  return `${card.name}\n${variants[cardId % variants.length]}`;
}

function mainPost(format: ContentFormat, hook: string): string {
  switch (format) {
    case "PICK_3": return `${hook}\n1, 2, 3 중 하나를 골라보세요.\n\n이번에는 큰 예언보다\n지금 눈에 걸리는 한 가지를 볼게요.\n\n1  2  3`;
    case "YES_NO_NOT_YET": return `${hook}\nYES / NO / NOT YET 중 하나만 고른다면?\n\n카드가 말하는 건 정답보다\n지금 덜 무리한 방향이에요.\n\n1 YES  2 NOT YET  3 NO`;
    case "LOVE": return `${hook}\n\n마음이 먼저인지, 행동이 먼저인지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "CAREER": return `${hook}\n\n더 버틸지, 다른 곳을 볼지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "MONEY": return `${hook}\n\n돈 이야기는 숫자만으로 끝나지 않아요.\n세 장 중 하나를 골라보세요.\n\n1  2  3`;
    case "THREE_CARD_SETS": return `${hook}\n\nA, B, C 중 가장 먼저 눈에 들어온 하나를 고르세요.`;
  }
}

function replyLines(cardIds: readonly number[], topic: ContentTopic): string[] {
  return [...cardIds.map((cardId, index) => `${index + 1}번\n\n${resultLine(cardId, topic)}`), CTA];
}

function readingSetReply(set: ThreadsReadingSet): string {
  const cardNames = set.cardIds.map((cardId) => getTarotCard(cardId).name).join(" · ");
  const scene = set.signal
    .replace(/것이 신호예요\.$/, "장면이에요.")
    .replace(/때가 신호예요\.$/, "때예요.")
    .replace(/순간이 신호예요\.$/, "순간이에요.")
    .replace(/경험이 신호예요\.$/, "경험이에요.")
    .replace(/연락이 신호예요\.$/, "연락이에요.")
    .replace(/소식이 신호예요\.$/, "소식이에요.")
    .replace(/밤이 신호예요\.$/, "밤이에요.")
    .replace(/일이 신호예요\.$/, "일이에요.");
  return `${set.key} ${set.symbol}\n${cardNames}\n\n${set.reading}\n\n곧 확인할 장면\n${scene}\n\n지금 할 일\n${set.action}`;
}

function pilotMainPost(template: CommercePilotTemplate): string {
  const choices = template.sets.map((set) => `${set.key} ${set.symbol}`).join(" / ");
  return `${template.hook}\n\n${template.promise}\n\n사진을 오래 보지 말고 가장 먼저 눈에 들어온 것을 고르세요.\n\n${choices}\n\n선택한 뒤 해당 답글만 펼쳐보세요.`;
}

/**
 * A Threads card-choice post is only useful when a reader can select one of
 * three cards and immediately receive all three prepared reading replies.
 * The publisher repeats this check directly before the external API call.
 */
export function readingThreadValidationError(item: Pick<ThreadsContent, "cardIds" | "replies" | "cta" | "readingSets">): string | null {
  const sets = item.readingSets;
  if (sets?.length) {
    if (sets.length !== 3) return `expected 3 complete reading sets, received ${sets.length}`;
    const expectedKeys = ["A", "B", "C"] as const;
    for (let index = 0; index < sets.length; index += 1) {
      const set = sets[index];
      if (!set || set.key !== expectedKeys[index]) return `missing prepared reading set ${expectedKeys[index]}`;
      if (set.cardIds.length !== 3 || new Set(set.cardIds).size !== 3) return `reading set ${set.key} must contain 3 distinct cards`;
      if (!set.reading || !set.signal || !set.action || !set.productReason) return `reading set ${set.key} is incomplete`;
      if (!item.replies[index]?.startsWith(`${set.key} ${set.symbol}\n`)) return `missing prepared reply for reading set ${set.key}`;
    }
    if (item.cardIds.length !== 9) return `expected 9 cards across 3 reading sets, received ${item.cardIds.length}`;
  } else if (item.cardIds.length !== 3) {
    return `expected 3 selectable cards, received ${item.cardIds.length}`;
  }
  if (item.replies.length !== 4) return `expected 3 reading replies and one CTA, received ${item.replies.length}`;
  if (!sets?.length) {
    for (let index = 0; index < 3; index += 1) {
      if (!item.replies[index]?.startsWith(`${index + 1}번\n\n`)) return `missing prepared reading for choice ${index + 1}`;
    }
  }
  if (item.replies[3] !== item.cta) return "final reply must be the configured CTA";
  return null;
}

function imageAsset(id: string): string | null {
  return `/threads/generated/${id}.png`;
}

function signature(item: Pick<ThreadsContent, "format" | "topic" | "cardIds" | "mainPost">): string {
  return [item.format, item.topic, [...item.cardIds].sort((a, b) => a - b).join("-"), item.mainPost.replace(/\d|\s|[.,!?/]/g, "")].join("|");
}

export function generateCommercePilot(createdAt = new Date().toISOString()): ThreadsContent[] {
  return COMMERCE_PILOT.map((template, index): ThreadsContent => {
    const id = `mr-tarot-${String(PILOT_START_ID + index).padStart(4, "0")}`;
    const cardIds = template.sets.flatMap((set) => set.cardIds);
    const main = pilotMainPost(template);
    const replies = [...template.sets.map(readingSetReply), CTA];
    const item: ThreadsContent = {
      id,
      status: "READY",
      format: "THREE_CARD_SETS",
      topic: template.topic,
      hook: template.hook,
      mainPost: main,
      cardIds,
      replies,
      cta: CTA,
      imageAsset: imageAsset(id),
      altText: `${template.hook} A ${template.sets[0].symbol}, B ${template.sets[1].symbol}, C ${template.sets[2].symbol} 중 하나를 고르는 미스터 타로 이미지`,
      createdAt,
      scheduledAt: null,
      publishedAt: null,
      threadsPostId: null,
      threadsContainerId: null,
      replyPostIds: [],
      attemptCount: 0,
      lastError: null,
      metrics: {},
      semanticSignature: "",
      readingSets: template.sets.map((set) => ({ ...set, cardIds: [...set.cardIds] as [number, number, number] })),
    };
    return { ...item, semanticSignature: signature(item) };
  });
}

export function generateContentQueue(count = 105, createdAt = new Date().toISOString()): ContentQueue {
  const plannedTopics = TOPIC_PLAN.flatMap(({ topic, count: topicCount }) => Array.from({ length: topicCount }, () => topic)).slice(0, count);
  const items = plannedTopics.map((topic, index): ThreadsContent => {
    const formats = TOPIC_FORMATS[topic];
    const format = formats[index % formats.length] ?? "PICK_3";
    const id = `mr-tarot-${String(index + 1).padStart(4, "0")}`;
    const cardIds = cardIdsFor(index + 1);
    const hook = hookFor(topic, index);
    const main = mainPost(format, hook);
    const item: ThreadsContent = {
      id,
      status: "READY",
      format,
      topic,
      hook,
      mainPost: main,
      cardIds,
      replies: replyLines(cardIds, topic),
      cta: CTA,
      imageAsset: imageAsset(id),
      altText: cardIds.length ? `${topic} 주제의 미스터 타로 선택 카드 ${cardIds.length}장` : null,
      createdAt,
      scheduledAt: null,
      publishedAt: null,
      threadsPostId: null,
      threadsContainerId: null,
      replyPostIds: [],
      attemptCount: 0,
      lastError: null,
      metrics: {},
      semanticSignature: "",
    };
    return { ...item, semanticSignature: signature(item) };
  });
  return { version: 1, generatedAt: createdAt, items };
}

export function validateContentQueue(queue: ContentQueue): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const signatures = new Set<string>();
  const banned = ["긍정적인 에너지", "내면의 목소리", "새로운 가능성이 열립니다", "균형을 찾아보세요"];

  for (const item of queue.items) {
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
    ids.add(item.id);
    if (signatures.has(item.semanticSignature)) errors.push(`${item.id}: semantic duplicate`);
    signatures.add(item.semanticSignature);
    if (!item.hook || !item.mainPost || !item.cta) errors.push(`${item.id}: missing required copy`);
    const hookError = hookQualityError(item.hook);
    if (hookError) errors.push(`${item.id}: ${hookError}`);
    if (!item.status) errors.push(`${item.id}: missing status`);
    if (item.mainPost.length > 500) errors.push(`${item.id}: main post too long`);
    const readingError = readingThreadValidationError(item);
    if (readingError) errors.push(`${item.id}: ${readingError}`);
    for (const cardId of item.cardIds) {
      try { getTarotCard(cardId); } catch { errors.push(`${item.id}: invalid card id ${cardId}`); }
    }
    const fullText = [item.hook, item.mainPost, ...item.replies, item.cta].join(" ");
    for (const phrase of banned) if (fullText.includes(phrase)) errors.push(`${item.id}: banned phrase ${phrase}`);
    if (item.format === "THREE_CARD_SETS") {
      if (fullText.includes("YES / NO / NOT YET")) errors.push(`${item.id}: deprecated choice language`);
      for (const reply of item.replies.slice(0, 3)) if (reply.length > 340) errors.push(`${item.id}: base reading reply is too long`);
    }
  }
  if (queue.items.length < 100) errors.push("queue: fewer than 100 items");
  return errors;
}
