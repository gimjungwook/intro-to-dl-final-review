# 딥러닝 개론 — 기말고사 인터랙티브 복습

한동대학교 **딥러닝 개론**(최희열 교수) 2026년 봄학기 기말고사 대비로 만든 15장짜리 인터랙티브 복습 사이트입니다. 교재 *Deep Learning Book* (Goodfellow, Bengio, Courville, MIT Press 2016) 1장부터 15장까지 각 장을 독립된 미니 사이트로 펼쳐, 본문에는 "왜 그 형태인가"라는 설명을 더하고 핵심 개념마다 캔버스·SVG 위젯으로 직접 손으로 만져볼 수 있게 했습니다.

> **라이브 사이트**: <https://gimjungwook.github.io/intro-to-dl-final-review/>

## 만든 사람

- 김정욱 (Jungwook Kim) · 한동대학교 22학번 · 학번 22000168
- 시험일: 2026-06-04 (목)

## 구조

```
intro-to-dl-final-review/
├── index.html              # 마스터 표지 + 15장 카드 + 표상의 사다리 히어로
├── assets/
│   ├── site.css            # 라이트 테마 (P2 신경 스타일 전이 사이트 디자인 계승)
│   └── widgets.js          # 공유 위젯 라이브러리
├── ch01-introduction/      # 표지 + 6 sub-chapter
├── ch02-linear-algebra/
├── ch03-probability/
├── ch04-numerical/
├── ch05-ml-basics/
├── ch06-feedforward/
├── ch07-regularization/
├── ch08-optimization/
├── ch09-cnn/
├── ch10-rnn/
├── ch11-practical/
├── ch12-applications/
├── ch13-linear-factor/
├── ch14-autoencoder/
└── ch15-representation/
```

각 챕터 폴더 안에는 `index.html`(챕터 표지)과 `01.html` ~ `NN.html`(sub-chapter)이 들어 있고, 마지막 sub-chapter는 핵심 정의·수식·예상 질문이 정리된 시험 대비 체크리스트입니다.

## 챕터 목록

### Part 1 — 응용 수학과 기계학습 기초

| 장 | 제목 | 핵심 키워드 |
|---|------|--------------|
| 01 | 딥러닝이란 무엇인가 | 표상, 깊이, 역사 |
| 02 | 선형대수 | 행렬, 고유분해, SVD, 노름 |
| 03 | 확률과 정보이론 | 베이즈, KL, 교차 엔트로피 |
| 04 | 수치 계산 | 경사하강, 헤시안, 조건수 |
| 05 | 기계학습 기초 | 편향-분산, MLE, 정칙화, 용량 |

### Part 2 — 깊은 네트워크와 현대적 실천

| 장 | 제목 | 핵심 키워드 |
|---|------|--------------|
| 06 | 깊은 순방향 신경망 | MLP, 역전파, ReLU, 출력층 |
| 07 | 정칙화 | L1/L2, 조기 종료, 드롭아웃 |
| 08 | 최적화 | Adam, 안장점, 배치 정규화, 모멘텀 |
| 09 | 합성곱 신경망 | CNN, 풀링, 변환 등가성, 아키텍처 |
| 10 | 순환 신경망과 시퀀스 모델 | RNN, BPTT, LSTM, GRU |
| 11 | 실용적 방법론 | 베이스라인, 디버깅, 튜닝 |
| 12 | 응용 | 비전, NLP, 음성, 강화학습 |

### Part 3 — 깊은 표상 학습

| 장 | 제목 | 핵심 키워드 |
|---|------|--------------|
| 13 | 선형 요소 모델 | PCA, ICA, 희소 코딩 |
| 14 | 자기부호화기 | DAE, CAE, 매니폴드 |
| 15 | 표상 학습 | 전이학습, 분산 표상, 사전훈련 |

## 디자인 시스템

전체 사이트는 같은 학기에 발표한 **P2 신경 스타일 전이 해설**(Gatys, Ecker, Bethge 2015 — *A Neural Algorithm of Artistic Style*) 인터랙티브 사이트의 디자인을 그대로 계승합니다. 라이트 테마, 책 같은 타이포, 두 극(쿨 파랑 = 구조/규칙, 웜 주홍 = 스타일/학습) 의미색, KaTeX 0.16.9를 통한 수식 렌더링, three.js r128을 통한 표지 히어로.

빌드 도구나 패키지 매니저는 사용하지 않습니다. 모든 외부 의존성은 CDN으로만 들어옵니다 — `index.html`을 더블클릭해도 그대로 열립니다.

## 우선순위 권장 학습 경로 (시험 D-9 기준)

1. Ch.6-9 (Part II 핵심) — Feedforward, Regularization, Optimization, CNN. 시험 비중 1순위
2. Ch.10-12 — RNN, Practical Methodology, Applications. 강의에서 다룬 비중 큼
3. Ch.13-15 — Linear Factor, Autoencoder, Representation Learning. 후반부 진도 직접 출제
4. Ch.1-5 — Intro, Linear Algebra, Probability, Numerical, ML Basics. 선행 개념 보완

## 사용법

브라우저로 라이브 사이트에 들어가거나, 이 저장소를 clone한 뒤 `index.html`을 직접 엽니다.

```bash
git clone https://github.com/gimjungwook/intro-to-dl-final-review.git
cd intro-to-dl-final-review
open index.html
```

각 챕터의 sidebar nav로 sub-chapter를 이동하고, 본문 안의 위젯은 슬라이더·드래그·hover로 직접 조작합니다.

## 라이선스

학습용 비공식 자료입니다. 교재 *Deep Learning Book*의 모든 권리는 원저자(Ian Goodfellow, Yoshua Bengio, Aaron Courville)에게 있습니다. 사이트의 글·코드는 자유롭게 참고·재배포하되 출처를 밝혀 주십시오.
