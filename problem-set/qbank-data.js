// 딥러닝 개론 기말 문제은행 26문항 데이터 — problem-set/q*.html + index.html 자동 추출
window.QBANK = [
  {
    "q": 1,
    "step": 1,
    "emoji": "🛡️",
    "part": 1,
    "partName": "정칙화와 일반화",
    "partEmoji": "🛡️",
    "title": "작은 데이터셋의 정칙화 전략",
    "qtext": "When the dataset is small compared to the model size, what kind of regularization approaches can we take?",
    "modelEn": "When the model has far more capacity than the small dataset can constrain, it overfits by memorising noise, so the cure is to inject prior knowledge that shrinks the hypothesis space. The main approaches are: (1) parameter-norm penalties — L2 weight decay and L1 sparsity; (2) parameter sharing or tying to reduce the number of free parameters; (3) data augmentation and noise injection (on inputs, weights, hidden units via dropout, and labels via label smoothing); (4) early stopping, which is equivalent to L2 under a quadratic approximation; and (5) transfer learning or unsupervised pre-training, which import knowledge learned from external data. The smaller the dataset, the more weight these priors should carry, and transfer learning becomes especially valuable.",
    "skeleton": [
      "핵심 한 줄 — 데이터 부족 = 고분산 과적합. 정칙화 = 사전 지식 주입으로 가설 공간 축소.",
      "벌점(L2/L1) · 파라미터 공유 · 데이터 증강과 노이즈 · 드롭아웃 · 조기 종료 · 비지도 사전훈련/전이를 나열.",
      "데이터가 적을수록 사전의 비중을 키운다, 특히 전이학습의 효과가 커진다고 마무리."
    ],
    "modelKo": "모델 용량(capacity)이 작은 데이터가 제약할 수 있는 수준보다 훨씬 크면 잡음까지 외워 과적합하므로, 처방은 가설 공간을 좁히는 사전 지식(prior)을 주입하는 것이다. 주요 접근은 (1) 파라미터 노름 벌점 — L2 가중치 감쇠(weight decay)와 L1 희소성, (2) 자유 파라미터 수를 줄이는 파라미터 공유(sharing)나 묶기(tying), (3) 데이터 증강과 노이즈 주입(입력, 가중치, 드롭아웃으로 은닉 유닛, 라벨 평활로 라벨), (4) 이차 근사 아래 L2와 동등한 조기 종료(early stopping), (5) 외부 데이터에서 배운 지식을 가져오는 전이학습(transfer learning)이나 비지도 사전훈련이다. 데이터가 적을수록 이 사전들의 비중을 키워야 하며 특히 전이학습의 효과가 커진다."
  },
  {
    "q": 2,
    "step": 2,
    "emoji": "🛡️",
    "part": 1,
    "partName": "정칙화와 일반화",
    "partEmoji": "🛡️",
    "title": "파라미터 묶기(tying)와 파라미터 공유(sharing)",
    "qtext": "Explain the parameter tying and parameter sharing.",
    "modelEn": "Both encode the prior that certain parameters are related; they differ in how hard that constraint is. Parameter tying adds a soft penalty on the distance between two parameter sets that pulls them close together (each set still kept separate), used when two related models or tasks should resemble each other. Parameter sharing forces parameters to be exactly identical — they are literally the same memory — as in CNN kernels reused across spatial positions or RNN weights reused across time steps. Sharing is the limiting case of tying with an infinite penalty, so it acts as an infinitely strong prior; it additionally saves memory and grants translation equivariance for free.",
    "skeleton": [
      "묶기 = 부드러운 벌점으로 두 파라미터를 가깝게. 공유 = 정확히 같은 파라미터(하드 제약, 같은 메모리).",
      "공유는 묶기의 극단(거리 벌점 무한대) = 무한히 강한 사전.",
      "공유 예 CNN·RNN, 묶기 예 지도/비지도 결합·도메인 적응. 공유는 메모리 절감 + 등가성 보너스."
    ],
    "modelKo": "둘 다 '어떤 파라미터들은 서로 관련 있다'는 사전을 거는 방법이지만, 제약의 강도가 다르다. 파라미터 묶기(tying)는 두 파라미터 집합의 거리에 부드러운 벌점을 더해 서로 가깝게 당기되 각자 별개로 유지하며, 관련된 두 모델이나 과제가 비슷해야 할 때 쓴다. 파라미터 공유(sharing)는 파라미터를 정확히 동일하게(물리적으로 같은 메모리) 강제하며, CNN 커널을 모든 공간 위치에 재사용하거나 RNN 가중치를 모든 시간 단계에 재사용하는 것이 예다. 공유는 거리 벌점을 무한대로 키운 묶기의 극한이라 무한히 강한 사전으로 작동하며, 추가로 메모리를 절감하고 평행이동 등가성(equivariance)을 공짜로 준다."
  },
  {
    "q": 3,
    "step": 3,
    "emoji": "🛡️",
    "part": 1,
    "partName": "정칙화와 일반화",
    "partEmoji": "🛡️",
    "title": "데이터 측면의 정칙화 트릭",
    "qtext": "As regularization, what kind of tricks can we take regarding data? (pretraining with unlabeled data, data augmentation, noise injection, etc.)",
    "modelEn": "These tricks regularise by making the model see a broader, more realistic input distribution so it cannot simply memorise the small training set. (1) Data augmentation generates new labelled examples through label-preserving transforms — translation, rotation, scaling, cropping, flips, colour jitter — which teaches the model known invariances, but the transform must never change the meaning (a horizontal flip ruins digit recognition by swapping 6 and 9). (2) Noise injection adds noise to inputs (close to an L2 penalty), to hidden units (dropout), to weights (favouring flat, robust minima), or to labels (label smoothing, which prevents an over-confident softmax). (3) Unsupervised or semi-supervised pre-training learns structure from abundant unlabelled data and transfers it as a prior or initialisation for the supervised task.",
    "skeleton": [
      "공통 원리 — 모델이 학습 분포를 더 넓게 보게 해 표본 암기를 막음.",
      "증강(라벨 보존 변환, 불변성 주입) · 노이즈(입력·은닉=드롭아웃·가중치·라벨=평활) · 비라벨 사전훈련/전이.",
      "증강은 의미를 바꾸지 않는 변환만, 입력 잡음은 L2 효과, 사전훈련은 입력 분포의 구조 지식을 분류 task의 prior로 전이."
    ],
    "modelKo": "이 트릭들은 모델이 더 넓고 현실적인 입력 분포를 보게 만들어 작은 훈련셋을 통째로 외우지 못하게 함으로써 정칙화한다. (1) 데이터 증강은 라벨 보존 변환(평행이동, 회전, 크기 변경, 자르기, 반전, 색 흔들기)으로 새 표본을 만들어 알려진 불변성을 가르치지만, 변환이 의미를 바꿔선 안 된다(좌우 반전은 6과 9를 뒤바꿔 숫자 인식을 망친다). (2) 노이즈 주입은 입력에(L2 벌점에 근접), 은닉 유닛에(드롭아웃), 가중치에(평평하고 강건한 최소점 선호), 라벨에(과신을 막는 라벨 평활) 잡음을 더한다. (3) 비지도/준지도 사전훈련은 풍부한 비라벨 데이터에서 구조를 배워 지도 과제의 사전이나 초기값으로 전이한다."
  },
  {
    "q": 22,
    "step": 4,
    "emoji": "🛡️",
    "part": 1,
    "partName": "정칙화와 일반화",
    "partEmoji": "🛡️",
    "title": "적대적 예제(adversarial examples)의 핵심",
    "qtext": "What is the main point of the adversarial examples?",
    "modelEn": "An adversarial example is an input carrying a tiny, deliberately crafted perturbation — imperceptible to a human — that makes a high-accuracy network misclassify with high confidence (e.g. FGSM, which nudges each pixel slightly in the direction that increases the loss). The main point is its cause: not excessive non-linearity, but excessive linearity in high dimensions. For a linear response, moving each input dimension by a tiny amount in the gradient's direction shifts the output by an amount that grows with the input dimension — each component changes negligibly, yet thousands of aligned changes sum to a large shift. This is both a security threat and, usefully, a regulariser: adversarial training pushes decision boundaries away from the data and improves generalisation.",
    "skeleton": [
      "정의 — 사람 눈에 안 보이는 의도적 미세 섭동으로 고정확도 모델을 고확신 오분류시키는 입력. 대표 생성법 FGSM (손실 증가 방향으로 각 픽셀 살짝 이동).",
      "핵심 원인은 비선형성이 아니라 고차원에서의 선형성. 픽셀당 변화는 작지만 수만 차원에 걸쳐 같은 방향으로 합산되어 출력 변화가 폭증. ReLU/LSTM 같은 부품의 piecewise-linearity가 원인.",
      "함의 — (1) 보안 위협 (값싸게 속일 수 있음), (2) 정칙화 기회 (adversarial training이 decision boundary를 멀리 밀어 일반화 향상), (3) 진단 도구 (모델이 진짜 의미가 아닌 표면적 통계를 학습했음을 폭로)."
    ],
    "modelKo": "적대적 예제(adversarial example)는 사람 눈에 안 보일 만큼 작지만 의도적으로 설계된 섭동을 더해, 고정확도 모델이 높은 확신으로 오분류하게 만드는 입력이다(예: 손실을 키우는 방향으로 각 픽셀을 살짝 미는 FGSM). 핵심은 그 원인이 과도한 비선형성이 아니라 고차원에서의 과도한 선형성이라는 점이다. 선형 반응에서 각 입력 차원을 기울기 방향으로 조금씩만 밀면 출력 변화는 차원 수에 비례해 커진다 — 성분 하나의 변화는 미미하지만 수만 개의 정렬된 변화가 합쳐져 큰 이동이 된다. 이는 보안 위협이면서 동시에 유용한 정칙화이기도 하다: 적대적 훈련은 결정 경계를 데이터에서 멀리 밀어 일반화를 높인다."
  },
  {
    "q": 23,
    "step": 5,
    "emoji": "🛡️",
    "part": 1,
    "partName": "정칙화와 일반화",
    "partEmoji": "🛡️",
    "title": "RBF 네트워크와 적대적 예제 면역",
    "qtext": "Describe radial basis function networks. And discuss why it does not have the adversarial example issue.",
    "modelEn": "A radial basis function (RBF) network has hidden units that respond to the distance from a prototype centre: each unit's activation peaks when the input matches the centre and falls off as a Gaussian when the input moves away. Each unit fires only near its centre and saturates to zero far away. It resists adversarial examples precisely because it is not linear: there is no linear path along which tiny per-dimension perturbations can accumulate into a large response — moving the input in any direction merely takes it further from the centre and lowers the activation. As a result the network is confident only near the training data and effectively reports \"I don't know\" elsewhere, so adversarial inputs are rejected with low confidence. The cost is lower accuracy and harder training — a clear robustness-accuracy trade-off.",
    "skeleton": [
      "RBF 유닛 — 중심점으로부터의 거리에 가우시안으로 반응, 멀면 0으로 포화. 입력 공간의 좁은 영역만 담당.",
      "적대적 면역 이유 — 선형 누적 경로가 없음. 섭동은 입력을 중심에서 멀어지게 해 응답을 오히려 줄임. 데이터 근처에서만 고확신.",
      "트레이드오프 — 강건하지만 학습 어렵고 정확도/일반화가 낮음."
    ],
    "modelKo": "방사 기저 함수(RBF) 네트워크는 은닉 유닛이 프로토타입 중심으로부터의 거리에 반응한다 — 입력이 중심과 일치하면 활성이 최대가 되고 멀어지면 가우시안으로 0까지 떨어진다. 각 유닛은 자기 중심 근처에서만 켜지고 멀리서는 0으로 포화한다. 적대적 예제에 강한 이유는 바로 선형이 아니기 때문이다: 차원별 미세 섭동이 큰 반응으로 누적될 선형 경로가 없어, 입력을 어느 방향으로 밀어도 중심에서 멀어져 활성이 오히려 줄어든다. 그 결과 네트워크는 훈련 데이터 근처에서만 확신하고 그 밖에서는 사실상 '모른다'고 답해, 적대적 입력을 낮은 확신으로 거부한다. 대가는 낮은 정확도와 어려운 학습 — 강건성과 정확도의 명확한 트레이드오프다."
  },
  {
    "q": 4,
    "step": 6,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "경사하강법 vs 뉴턴법",
    "qtext": "Describe and compare the gradient descent method and the Newton method.",
    "modelEn": "Gradient descent is a first-order method that moves the parameters against the gradient by a fixed step size (learning rate). It is cheap per step but blind to curvature, so the learning rate must be tuned by hand and it zig-zags on ill-conditioned surfaces. Newton's method is second-order: it uses the inverse Hessian to rescale each direction by its curvature, reaching the minimum of a pure quadratic in a single step and being immune to ill-conditioning. In deep learning Newton is rarely usable: inverting the Hessian costs cubic time in the number of parameters (millions to billions), it can be attracted to saddle points when the Hessian is not positive-definite, and the local quadratic model is inaccurate on non-convex loss surfaces. We therefore use cheap curvature-aware first-order methods such as momentum, RMSProp, and Adam.",
    "skeleton": [
      "경사하강 = 1차(기울기만), 뉴턴 = 2차(곡률까지). 경사하강은 보폭 사람이 정해야, 뉴턴은 곡률이 자동 결정.",
      "뉴턴은 ill-conditioned 골짜기에 면역, 순수 2차 함수면 한 걸음에 바닥. 경사하강은 지그재그.",
      "딥러닝에서 뉴턴 못 쓰는 이유 — 계산 비용 (파라미터 수의 세제곱), 안장점 위험, 비볼록 곡면에서 국소 근사 부정확. → 모멘텀·Adam이 절충."
    ],
    "modelKo": "경사하강법(gradient descent)은 고정 보폭(학습률)만큼 기울기 반대 방향으로 움직이는 1차 방법이다. 스텝당 비용은 싸지만 곡률을 모르므로 학습률을 손으로 맞춰야 하고 조건수가 나쁜 곡면에서 지그재그한다. 뉴턴법(Newton's method)은 2차 방법으로, 헤시안 역행렬로 각 방향을 곡률에 맞춰 재조정해 순수 이차함수의 최소점에 한 번에 도달하고 나쁜 조건수에 영향받지 않는다. 딥러닝에서 뉴턴법은 거의 못 쓴다: 헤시안 역행렬 계산이 파라미터 수(수백만~수십억)의 3제곱 비용이고, 헤시안이 양정치가 아니면 안장점에 끌리며, 비볼록 손실면에서 국소 이차 근사가 부정확하다. 그래서 모멘텀, RMSProp, Adam 같은 값싼 곡률 인식형 1차 방법을 쓴다."
  },
  {
    "q": 5,
    "step": 7,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "배치 / 확률적 / 미니배치 경사하강",
    "qtext": "Compare the batch gradient, stochastic gradient and mini-batch gradient descent methods.",
    "modelEn": "The three differ only in how many examples estimate the gradient per update. Batch (full) gradient descent uses the whole training set: the gradient is exact and convergence smooth, but each update needs a full pass and large memory, which is impractical on large data. Stochastic gradient descent (SGD) uses a single example per update: updates are frequent and the noise helps escape shallow minima and saddle points, but the gradient is high-variance and cannot exploit GPU vectorisation. Mini-batch gradient descent uses m examples (typically 32-256) and is the modern standard, because the estimate's accuracy improves only as the square root of the batch size — diminishing returns favour small-ish batches — and GPUs process the whole batch in parallel; its residual noise even acts as a mild regulariser by steering training toward flat minima that generalise better.",
    "skeleton": [
      "차이는 업데이트당 예제 수: 전체 / 1개 / m개.",
      "배치=정확하나 느리고 메모리↑, SGD=잦고 잡음 탈출 도움이나 분산↑·벡터화 불가, 미니배치=절충.",
      "미니배치가 표준인 이유 — 표본 늘려도 정확도는 제곱근으로만 좋아짐 (수확 체감) + GPU 병렬효율 + 잡음의 약한 정칙화 (flat minimum 선호)."
    ],
    "modelKo": "셋은 한 번의 갱신에 몇 개의 표본으로 기울기를 추정하느냐만 다르다. 배치(전체) 경사하강은 전체 훈련셋을 써 기울기가 정확하고 수렴이 매끄럽지만, 갱신마다 전체 순회와 큰 메모리가 필요해 대규모 데이터에선 비현실적이다. 확률적 경사하강(SGD)은 갱신당 한 표본만 써 갱신이 잦고 잡음이 얕은 최소점과 안장점 탈출을 돕지만, 기울기 분산이 크고 GPU 벡터화를 못 쓴다. 미니배치 경사하강은 m개(보통 32~256) 표본을 써 현대 표준인데, 추정 정확도가 배치 크기의 제곱근으로만 좋아져(수확 체감) 작은 배치가 유리하고 GPU가 배치 전체를 병렬 처리하기 때문이다. 남은 잡음은 평평한 최소점으로 유도해 일반화를 돕는 약한 정칙화 역할도 한다."
  },
  {
    "q": 6,
    "step": 8,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "최적화의 모멘텀(momentum)",
    "qtext": "What is the momentum in optimization?",
    "modelEn": "Momentum accumulates an exponentially decaying moving average of past gradients into a velocity term, and the parameters move by that velocity each step. It helps because in an ill-conditioned ravine the oscillating directions reverse every step and cancel out on average, while the consistent downhill direction accumulates and accelerates — like a heavy ball rolling that coasts through small bumps (mini-batch noise) and shallow dips (poor local minima). With a typical momentum coefficient of 0.9 the effective step is amplified roughly tenfold along consistent directions. Nesterov momentum refines this by evaluating the gradient at the look-ahead position (where momentum is about to take you), correcting before it overshoots.",
    "skeleton": [
      "정의 — 과거 기울기의 지수평균을 \"속도\"에 누적, 매 step에서 그 속도만큼 이동. 관성 계수 (보통 0.9)가 과거 속도 유지 비율.",
      "효과 — 진동하는 축은 상쇄, 일관된 축은 누적·가속. 미니배치 잡음 평균화, 얕은 local minimum 관성 통과. 종단 속도는 단순 경사하강의 약 10배.",
      "네스테로프 변형 = 관성으로 미리 가본 미래 위치에서 기울기 계산 → 지나치기 전에 보정."
    ],
    "modelKo": "모멘텀(momentum)은 과거 기울기의 지수 감쇠 이동평균을 속도(velocity) 항에 누적하고, 파라미터는 매 스텝 그 속도만큼 움직인다. 조건수가 나쁜 협곡에서 진동하는 방향은 매 스텝 부호가 뒤집혀 평균적으로 상쇄되고, 일관되게 내리막인 방향은 누적되어 가속되기 때문에 도움이 된다 — 무거운 공이 굴러 작은 요철(미니배치 잡음)과 얕은 웅덩이(나쁜 국소 최소점)를 관성으로 통과하는 것과 같다. 흔한 모멘텀 계수 0.9에서는 일관된 방향의 유효 보폭이 약 10배 증폭된다. 네스테로프 모멘텀(Nesterov)은 모멘텀이 데려갈 미리보기 위치에서 기울기를 평가해 과도하게 넘어가기 전에 보정한다."
  },
  {
    "q": 7,
    "step": 9,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "절벽(cliffs)과 기울기 폭발(exploding gradient)",
    "qtext": "As an optimization challenge, what is the relation between cliffs and exploding gradient?",
    "modelEn": "Cliffs are regions of the loss surface that drop almost vertically; they arise in deep networks and RNNs because weights are multiplied repeatedly across layers or time steps. The relation is one of cause and symptom: the cliff is the geometric cause, and the exploding gradient is the symptom at its edge. Near a cliff the gradient magnitude blows up, so a normal-sized step hurls the parameters far away and destroys prior progress. In RNNs this occurs when the recurrent weight matrix's largest eigenvalue exceeds 1, making the gradient grow exponentially with the number of time steps. The standard remedy is gradient clipping (Q15), which caps the step size while keeping its direction.",
    "skeleton": [
      "절벽 = 가중치 반복 곱으로 생긴 거의 수직인 손실 영역(기하학적 원인).",
      "기울기 폭발 = 절벽 근처에서 기울기 크기가 폭증하는 증상. 보폭 곱하면 파라미터가 멀리 날아감.",
      "RNN에서는 순환 가중치 행렬의 가장 큰 확대 비율이 1보다 크면 시간 축을 따라 기울기가 지수적으로 폭발. (반대로 작으면 소실 → LSTM·GRU 등장 배경.) 처방 = 기울기 클리핑(방향 유지, 크기만 상한 적용)."
    ],
    "modelKo": "절벽(cliff)은 손실면이 거의 수직으로 떨어지는 영역으로, 깊은 신경망과 RNN에서 가중치가 층이나 시간 단계에 걸쳐 반복 곱해져 생긴다. 절벽과 기울기 폭발의 관계는 원인과 증상이다: 절벽은 기하학적 원인이고, 기울기 폭발은 그 가장자리에서 나타나는 증상이다. 절벽 근처에서 기울기 크기가 폭증해 평범한 보폭의 스텝도 파라미터를 멀리 던져 이전 진척을 파괴한다. RNN에서는 순환 가중치 행렬의 최대 고윳값이 1을 넘을 때 발생해 기울기가 시간 단계 수에 지수적으로 커진다. 표준 처방은 방향은 유지한 채 보폭만 제한하는 기울기 클리핑(Q15)이다."
  },
  {
    "q": 8,
    "step": 10,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "가중치 공간 대칭성(weight space symmetry)",
    "qtext": "What is the weight space symmetry?",
    "modelEn": "Weight-space symmetry is the fact that many different weight settings implement exactly the same input-output function, so the network is non-identifiable — you cannot recover unique weights from the function. The most common case is hidden-unit permutation: swapping the incoming and outgoing weights of two hidden units leaves the computed function unchanged, so m units yield at least m! (m factorial) equivalent configurations; odd activations such as tanh add a sign-flip symmetry. The consequences are that the loss has at least m! equivalent global minima, that this is one source of non-convexity, and that an individual weight value has no absolute meaning — but since all copies are equivalent, the symmetry itself does not make optimisation harder.",
    "skeleton": [
      "정의 — 다른 가중치가 같은 함수를 구현(비식별 모델).",
      "은닉 유닛 m개 재배열 → m! 개 동등 설정. tanh 같은 홀함수 활성에선 부호반전 대칭 추가.",
      "함의 — 동등 전역최소 m! 개, 비볼록성의 한 원인, 개별 가중치 값은 절대 의미 없음 (해석 위험). 단 모든 사본이 동등 성능이라 최적화가 더 어려워지지는 않음."
    ],
    "modelKo": "가중치 공간 대칭성(weight space symmetry)은 서로 다른 여러 가중치 설정이 정확히 같은 입출력 함수를 구현해, 네트워크가 식별 불가능(non-identifiable)하다는 사실이다 — 함수로부터 유일한 가중치를 복원할 수 없다. 가장 흔한 경우는 은닉 유닛 치환이다: 두 은닉 유닛의 입력 가중치와 출력 가중치를 맞바꿔도 계산 함수가 변하지 않아, m개 유닛은 최소 m!(m 팩토리얼)개의 등가 설정을 낳고, tanh 같은 홀함수는 부호 반전 대칭을 더한다. 결과적으로 손실은 최소 m!개의 등가 전역 최소점을 가지며, 이것이 비볼록성의 한 원인이고, 개별 가중치 값은 절대적 의미가 없다 — 다만 모든 복제가 등가이므로 대칭성 자체가 최적화를 어렵게 하진 않는다."
  },
  {
    "q": 15,
    "step": 11,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "기울기 클리핑(gradient clipping)",
    "qtext": "What is gradient clipping?",
    "modelEn": "Gradient clipping rescales the gradient whenever its magnitude exceeds a threshold, while preserving its direction: if the gradient is too large, rescale it down to the threshold size in the same direction. It is the direct remedy for cliffs and exploding gradients (Q7): when the gradient blows up near a cliff, clipping caps the step so the parameters are not catapulted away, yet the descent direction is unchanged — like a car's speed limiter that bounds how fast you go without changing where you steer. It is a standard safeguard in RNN training; an element-wise variant clipping each component to a fixed range exists, but norm clipping is preferred because it keeps the direction intact.",
    "skeleton": [
      "정의 — 기울기 크기가 임계값을 넘으면 임계값 크기로 정규화. 방향 보존, 크기만 상한 적용.",
      "목적 — 절벽/기울기 폭발(Q7) 처방. 한 걸음이 파라미터를 멀리 날리는 것을 방지.",
      "RNN 표준. 방향 보존이 핵심."
    ],
    "modelKo": "기울기 클리핑(gradient clipping)은 기울기 크기가 임계값을 넘으면 방향은 보존한 채 크기만 재조정한다: 너무 크면 같은 방향으로 임계값 크기까지 줄인다. 절벽과 기울기 폭발(Q7)의 직접 처방으로, 절벽 근처에서 기울기가 폭증할 때 보폭을 제한해 파라미터가 멀리 튕겨 나가지 않게 하되 하강 방향은 그대로 둔다 — 어디로 핸들을 꺾을지는 안 바꾸고 속도만 제한하는 차량의 속도 제한기와 같다. RNN 학습의 표준 안전장치이며, 각 성분을 고정 범위로 자르는 원소별 변형도 있지만 방향을 온전히 보존하는 노름 클리핑이 선호된다."
  },
  {
    "q": 16,
    "step": 12,
    "emoji": "⚙️",
    "part": 2,
    "partName": "최적화와 하이퍼파라미터",
    "partEmoji": "⚙️",
    "title": "그리드 탐색과 무작위 탐색",
    "qtext": "In hyperparameter search, what is grid search and random search?",
    "modelEn": "Both search hyperparameters that gradient descent cannot tune. Grid search picks a few candidate values per hyperparameter and tries every combination (the Cartesian product), so the number of trials grows exponentially with the number of hyperparameters. Random search instead samples each hyperparameter from a distribution for a fixed number of trials. Random usually wins because typically only a few hyperparameters matter: a 3-by-3 grid tests only 3 distinct values of each parameter, whereas 9 random trials test 9 distinct values of the important one — exploring it three times more finely for the same budget. Bayesian optimisation is the smarter successor, but random search remains a strong, trivially parallelisable baseline.",
    "skeleton": [
      "그리드 = 후보값들의 모든 조합. 무작위 = 분포에서 N번 추출.",
      "그리드는 차원에 지수 폭발 + 각 축을 적은 값만 시험. 무작위는 각 축을 N개 서로 다른 값으로.",
      "이유 — 소수 파라미터만 중요. 무작위가 중요 축을 더 촘촘히. (베이지안 최적화는 더 똑똑한 후속.)"
    ],
    "modelKo": "둘 다 경사하강이 못 맞추는 하이퍼파라미터를 탐색한다. 그리드 탐색은 하이퍼파라미터마다 몇 개의 후보값을 정해 모든 조합(데카르트 곱)을 시도하므로 시도 수가 하이퍼파라미터 수에 지수적으로 증가한다. 무작위 탐색은 대신 각 하이퍼파라미터를 분포에서 정해진 횟수만큼 표본추출한다. 보통 소수의 하이퍼파라미터만 중요하기 때문에 무작위가 유리하다: 3×3 그리드는 각 파라미터의 서로 다른 값을 3개만 시험하지만, 9번의 무작위 시도는 중요한 파라미터의 서로 다른 값을 9개 시험해 같은 예산으로 3배 더 촘촘히 탐색한다. 베이지안 최적화가 더 똑똑한 후속이지만, 무작위 탐색은 병렬화가 자명한 강력한 기준선으로 남아 있다."
  },
  {
    "q": 9,
    "step": 13,
    "emoji": "🖼️",
    "part": 3,
    "partName": "합성곱 신경망 CNN",
    "partEmoji": "🖼️",
    "title": "CNN이 이미지에 특히 강력한 이유",
    "qtext": "Why is CNN powerful especially on image data?",
    "modelEn": "A fully connected layer on a 256×256 image would link each output to about 65,000 inputs, giving billions of weights per layer. A CNN does the same job with far fewer parameters through three structural properties drawn from the statistics of natural images: sparse interactions (each output sees only a small local window), parameter sharing (the same kernel is applied at every position), and equivariant representations (shifting the input shifts the feature map). These yield a massive reduction in parameters and memory that is independent of image size, statistical efficiency (a pattern learned at one location automatically generalises to all locations), and hierarchical features — as depth grows the receptive field, edges combine into textures, parts, and finally objects. Adding pooling further produces approximate invariance to small translations.",
    "skeleton": [
      "완전연결의 파라미터 폭발 → CNN의 세 속성: 희소 상호작용 · 파라미터 공유 · 변환 등가성.",
      "위력 — 파라미터/메모리 격감, 통계적 효율(위치 일반화), 깊이에 따른 계층적 특징. + 풀링의 근사 불변성.",
      "근거 — 국소성·정상성이라는 자연 이미지 사실에 사전이 맞기 때문."
    ],
    "modelKo": "256×256 이미지에 완전연결층을 쓰면 각 출력이 약 65,000개 입력과 연결되어 층당 수십억 개 가중치가 된다. CNN은 자연 이미지의 통계에서 끌어낸 세 가지 구조적 성질로 같은 일을 훨씬 적은 파라미터로 한다: 희소 상호작용(각 출력은 작은 국소 창만 봄), 파라미터 공유(같은 커널을 모든 위치에 적용), 등가 표상(입력이 이동하면 특징맵도 이동). 이로써 이미지 크기와 무관한 막대한 파라미터/메모리 절감, 통계적 효율(한 위치에서 배운 패턴이 모든 위치에 자동 일반화), 계층적 특징(깊이가 커지며 수용영역이 넓어지고 에지→질감→부분→물체로 결합)을 얻는다. 풀링을 더하면 작은 평행이동에 대한 근사 불변성까지 생긴다."
  },
  {
    "q": 10,
    "step": 14,
    "emoji": "🖼️",
    "part": 3,
    "partName": "합성곱 신경망 CNN",
    "partEmoji": "🖼️",
    "title": "CNN의 평행이동 불변성(translation invariance)",
    "qtext": "What is translation invariance with CNN?",
    "modelEn": "The key is to distinguish two concepts. Equivariance means \"when the input shifts, the output shifts the same way\" — this is what convolution itself provides. Invariance means \"the output is unchanged when the input shifts\" — convolution alone does not give this. Translation invariance appears only when pooling is added: max pooling keeps the strongest response in a region, so a small shift within that region leaves the output unchanged, producing approximate invariance to small translations. Classification needs invariance (\"is there a cat?\"), whereas localisation needs equivariance (\"where is the cat?\"); a CNN supplies equivariance through convolution and stacks pooling to build up invariance, which is therefore local and only approximate.",
    "skeleton": [
      "등가성(움직이면 따라감, 합성곱) vs 불변성(움직여도 그대로, 풀링)을 먼저 구분.",
      "합성곱은 등가적이지 불변이 아님. 최대 풀링이 영역 내 최강 반응만 남겨 작은 이동에 근사 불변.",
      "분류엔 불변성, 위치추정엔 등가성. 풀링 불변성은 국소·근사."
    ],
    "modelKo": "핵심은 두 개념의 구분이다. 등가성(equivariance)은 '입력이 이동하면 출력도 같은 방식으로 이동한다'로, 합성곱 자체가 주는 것이다. 불변성(invariance)은 '입력이 이동해도 출력이 변하지 않는다'로, 합성곱만으로는 안 된다. 평행이동 불변성은 풀링을 더해야 나타난다: 맥스 풀링은 한 영역에서 가장 강한 반응을 남기므로 그 영역 안에서의 작은 이동은 출력을 바꾸지 않아 작은 평행이동에 근사 불변이 된다. 분류는 불변성('고양이가 있나?')이, 위치 추정은 등가성('고양이가 어디?')이 필요하다. CNN은 합성곱으로 등가성을 주고 풀링을 쌓아 불변성을 만들기에, 불변성은 국소적이고 근사적이다."
  },
  {
    "q": 11,
    "step": 15,
    "emoji": "🖼️",
    "part": 3,
    "partName": "합성곱 신경망 CNN",
    "partEmoji": "🖼️",
    "title": "무한히 강한 사전(infinitely strong prior)이 CNN에 더해지는 방식",
    "qtext": "How is the infinitely strong prior added to CNN?",
    "modelEn": "A prior is a distribution over parameters that says which values are plausible before seeing data, and its strength is how narrow that distribution is. A weak prior (e.g. L2's Gaussian) merely discourages some values, whereas an infinitely strong prior assigns zero probability to certain parameters, forbidding them entirely. A CNN is exactly a fully connected layer carrying an infinitely strong prior on its weights: (1) a unit's weights must be zero outside a small receptive field (locality), and (2) the weights of neighbouring spatial positions must be identical (sharing) — any configuration that violates these has zero prior probability and can never be learned. Pooling is likewise an infinitely strong prior that each unit should be invariant to small translations. This view predicts when a CNN helps (when the prior matches the data, e.g. natural images) versus hurts (tabular or graph data, where it underfits), and warns that comparing a CNN against a fully connected net is unfair when the CNN's built-in prior happens to suit the task.",
    "skeleton": [
      "사전의 세기 = 분포의 좁기. 무한히 강한 사전 = 일부 파라미터에 확률 0(금지).",
      "CNN = 완전연결층 + 무한히 강한 사전: ①수용영역 밖 가중치=0(국소) ②이웃 위치 가중치 동일(공유). 풀링 = 작은 이동 불변 사전.",
      "유용성 — 사전이 데이터에 맞으면 효율, 안 맞으면 과소적합. 벤치마크 비교의 함정 경고."
    ],
    "modelKo": "사전(prior)은 데이터를 보기 전에 어떤 파라미터 값이 그럴듯한지에 대한 분포이고, 그 강도는 분포가 얼마나 좁은가다. 약한 사전(예: L2의 가우시안)은 일부 값을 억제할 뿐이지만, 무한히 강한 사전은 특정 파라미터에 0 확률을 줘 완전히 금지한다. CNN은 정확히, 가중치에 무한히 강한 사전을 건 완전연결층이다: (1) 유닛의 가중치는 작은 수용영역 밖에선 0이어야 하고(국소성), (2) 이웃 공간 위치의 가중치는 동일해야 한다(공유) — 이를 어기는 설정은 사전 확률이 0이라 결코 학습될 수 없다. 풀링도 각 유닛이 작은 평행이동에 불변해야 한다는 무한히 강한 사전이다. 이 관점은 사전이 데이터와 맞을 때(자연 이미지) CNN이 도움 되고 안 맞을 때(표/그래프 데이터) 과소적합함을 예측하며, CNN의 내장 사전이 마침 과제에 맞을 때 완전연결망과 비교하는 것은 불공정함을 경고한다."
  },
  {
    "q": 12,
    "step": 16,
    "emoji": "🔁",
    "part": 4,
    "partName": "순환 신경망과 시퀀스",
    "partEmoji": "🔁",
    "title": "RNN은 재귀 신경망(recursive NN)의 특수 경우",
    "qtext": "Why is RNN a special case of recursive neural network?",
    "modelEn": "Both apply the same parameters repeatedly across the nodes of a structure, combining children into a parent representation. A recursive neural network operates on a general tree (or DAG) structure — for example a sentence's parse tree, where one composition function merges two child phrases into a parent. An RNN is the special case in which that structure is a chain — a degenerate, linear tree: each step's node has a single child (the previous state) plus the current input. So an RNN is a recursive network whose topology has been narrowed to a path. A practical consequence is that an RNN's depth grows linearly with the sequence length, whereas a balanced recursive tree grows only logarithmically, so trees can be gentler on gradients over long dependencies.",
    "skeleton": [
      "공통 — 같은 파라미터를 구조의 모든 노드에 반복 적용해 자식→부모로 합침.",
      "재귀망 = 일반 트리/DAG 구조. RNN = 그 구조가 사슬(퇴화 트리)인 특수 경우.",
      "결과 — RNN 깊이는 시퀀스 길이 n에 비례, 균형 트리는 log n에 그침. 트리가 긴 의존성·기울기 보존에 유리할 수 있음."
    ],
    "modelKo": "둘 다 같은 파라미터를 구조의 노드들에 반복 적용해 자식들을 부모 표상으로 결합한다. 재귀 신경망(recursive NN)은 일반 트리(또는 DAG) 구조 위에서 작동한다 — 예컨대 문장의 파스 트리에서 하나의 결합 함수가 두 자식 구를 부모로 합친다. RNN은 그 구조가 사슬인 특수 경우다 — 퇴화된 선형 트리로, 각 단계의 노드는 자식이 하나(이전 상태)에 현재 입력이 더해진다. 즉 RNN은 위상이 경로로 좁혀진 재귀 신경망이다. 실용적 함의로, RNN의 깊이는 시퀀스 길이에 선형으로 커지는 반면 균형 잡힌 재귀 트리는 로그로만 커져, 트리가 긴 의존성에서 기울기에 더 너그러울 수 있다."
  },
  {
    "q": 13,
    "step": 17,
    "emoji": "🔁",
    "part": 4,
    "partName": "순환 신경망과 시퀀스",
    "partEmoji": "🔁",
    "title": "LSTM의 ‘기억 소실(memory-fade-away)’ 극복",
    "qtext": "How does LSTM overcome the ‘memory-fade-away’ issue?",
    "modelEn": "In a vanilla RNN the hidden state is multiplied by the same recurrent weight matrix at every step, so the influence of an input k steps back scales like the matrix multiplied k times; if the largest eigenvalue is below 1 the gradient vanishes exponentially (and the tanh derivative, being below 1, worsens it), so long-range dependencies are lost. The LSTM fixes this with a cell state that is updated additively and gated: the new cell state is the previous cell state weighted by a forget gate plus a new candidate weighted by an input gate. This additive self-loop is the Constant Error Carousel — when the forget gate is close to 1 the cell state is preserved and the gradient flows along it at roughly 1, with no repeated matrix multiplication, so it does not vanish. The forget, input, and output gates let the network learn when to keep, write, and expose information.",
    "skeleton": [
      "원인 — 바닐라 RNN은 순환 가중치 행렬이 반복 곱해짐. 가장 큰 확대 비율(eigenvalue)이 1보다 작으면 기울기가 지수적으로 소실. tanh 도함수가 항상 1보다 작아 더 악화.",
      "해법 — cell state를 곱셈이 아닌 덧셈으로 갱신 + forget/input/output gate로 정보 흐름 제어. CEC(Constant Error Carousel)로 기울기가 약 1로 유지되어 소실되지 않음.",
      "게이트(망각·입력·출력)로 언제 기억/망각할지 학습. 행렬 반복 곱이 없어 소실 제거."
    ],
    "modelKo": "기본 RNN은 매 단계 은닉 상태에 같은 순환 가중치 행렬을 곱하므로 k단계 전 입력의 영향이 행렬을 k번 곱한 만큼 스케일된다; 최대 고윳값이 1보다 작으면 기울기가 지수적으로 소실되고(1보다 작은 tanh 도함수가 더 악화) 장기 의존성을 잃는다. LSTM은 덧셈으로 갱신되고 게이트로 제어되는 셀 상태(cell state)로 이를 해결한다: 새 셀 상태 = 망각 게이트로 가중한 이전 셀 상태 + 입력 게이트로 가중한 새 후보. 이 덧셈 자기 루프가 상수 오류 회전목마(Constant Error Carousel)다 — 망각 게이트가 1에 가까우면 셀 상태가 보존되고 기울기가 그 길을 따라 약 1로 흘러 반복 행렬 곱이 없어 소실되지 않는다. 망각/입력/출력 게이트가 정보를 언제 유지, 기록, 노출할지 학습하게 한다."
  },
  {
    "q": 14,
    "step": 18,
    "emoji": "🔁",
    "part": 4,
    "partName": "순환 신경망과 시퀀스",
    "partEmoji": "🔁",
    "title": "RNN vs CNN — 파라미터 공유와 측면 연결",
    "qtext": "Compare RNN and CNN in terms of parameter sharing and lateral connection.",
    "modelEn": "Both share parameters, but along different axes. A CNN shares across space — the same kernel is applied at every spatial position — whereas an RNN shares across time — the same transition weights are applied at every time step; both cut the number of free parameters, generalise what is learned across positions or times, and grant a form of equivariance. The decisive difference is the lateral connection: an RNN has lateral (recurrent) connections, so the unit at one time step feeds the unit at the next, and information flows sideways along the sequence through the hidden state; a CNN has no lateral connections within a layer — each output is computed independently from its local receptive field, and distant inputs are reached only by stacking layers to enlarge that field. Thus a CNN parallelises easily but its context is bounded by depth, while an RNN reaches arbitrarily far through recurrence but is sequential and prone to vanishing gradients (self-attention later overcomes both — Q25).",
    "skeleton": [
      "공유 축 — CNN=공간, RNN=시간. 둘 다 파라미터 절감 + 위치/시점 일반화 + 등가성.",
      "측면 연결 — RNN 있음(순환, 상태가 옆으로 흐름), CNN 없음(먼 입력엔 깊이로 닿음).",
      "대가 — CNN 병렬·수용영역 한계, RNN 무한문맥이나 순차·소실. (→ self-attention이 절충, Q25.)"
    ],
    "modelKo": "둘 다 파라미터를 공유하지만 축이 다르다. CNN은 공간에 걸쳐 공유하고(같은 커널을 모든 공간 위치에), RNN은 시간에 걸쳐 공유한다(같은 전이 가중치를 모든 시간 단계에); 둘 다 자유 파라미터 수를 줄이고 배운 것을 위치/시간에 일반화하며 일종의 등가성을 준다. 결정적 차이는 측면(lateral) 연결이다: RNN은 측면(순환) 연결이 있어 한 시간 단계의 유닛이 다음 유닛으로 이어지고 정보가 은닉 상태를 통해 시퀀스를 따라 옆으로 흐른다; CNN은 한 층 안에 측면 연결이 없어 각 출력이 자기 국소 수용영역에서 독립적으로 계산되고, 먼 입력은 층을 쌓아 수용영역을 넓혀야만 닿는다. 따라서 CNN은 병렬화가 쉽지만 문맥이 깊이에 한정되고, RNN은 순환으로 임의로 멀리 닿지만 순차적이고 기울기 소실에 취약하다(셀프 어텐션이 나중에 둘 다 극복 — Q25)."
  },
  {
    "q": 17,
    "step": 19,
    "emoji": "🧭",
    "part": 5,
    "partName": "비지도 학습과 표상",
    "partEmoji": "🧭",
    "title": "느린 특징 분석(Slow Feature Analysis, SFA)",
    "qtext": "What is slow feature analysis (SFA)?",
    "modelEn": "SFA is an unsupervised feature-learning method built on the slowness principle: the meaningful high-level features of an environment vary slowly compared with the raw sensory input — a zebra crossing the view flips a pixel rapidly between black and white, yet \"a zebra is present\" changes slowly. SFA learns features from a time series that change as slowly as possible, minimising the squared difference between consecutive time steps' feature values. To rule out the trivial constant solution it imposes zero mean and unit variance, and to stop every feature collapsing onto the same slow signal it requires the features to be decorrelated/orthogonal. Linear SFA reduces to an eigenvalue problem, and the slow features it recovers correspond to invariant representations such as complex cells — a classic example of learning invariances without labels.",
    "skeleton": [
      "느림 원리 — 고수준 특징은 원시 입력보다 천천히 변함(얼룩말 픽셀 vs 존재).",
      "목적 — 시간 따라 다음 프레임 특징과 현재 프레임 특징의 차이(시간 변화량)를 최소화.",
      "제약 — 평균0·분산1(자명해 배제) + 직교(붕괴 방지). 불변 특징을 비지도로 학습."
    ],
    "modelKo": "느린 특징 분석(SFA)은 느림 원리(slowness principle)에 기반한 비지도 특징 학습법이다: 환경의 의미 있는 고수준 특징은 원시 감각 입력에 비해 천천히 변한다 — 얼룩말이 화면을 가로지르면 픽셀은 흑백을 빠르게 오가지만 '얼룩말이 있다'는 천천히 변한다. SFA는 시계열에서 가능한 한 천천히 변하는 특징을 학습하며, 연속한 시간 단계의 특징값 차이의 제곱을 최소화한다. 자명한 상수 해를 배제하려 평균 0, 분산 1을 부과하고, 모든 특징이 같은 느린 신호로 붕괴하는 것을 막으려 특징들이 서로 비상관/직교하도록 요구한다. 선형 SFA는 고윳값 문제로 귀결되며, 복원되는 느린 특징은 복합 세포(complex cell) 같은 불변 표상에 해당한다 — 라벨 없이 불변성을 배우는 고전적 예다."
  },
  {
    "q": 18,
    "step": 20,
    "emoji": "🧭",
    "part": 5,
    "partName": "비지도 학습과 표상",
    "partEmoji": "🧭",
    "title": "오토인코더 vs PCA",
    "qtext": "Compare Autoencoder and PCA.",
    "modelEn": "Both compress the input to a low-dimensional code and reconstruct it. PCA finds the orthogonal directions of greatest variance and projects linearly onto that subspace; crucially, a one-hidden-layer autoencoder with linear activations and squared-error loss learns the same subspace as PCA, so a linear autoencoder is PCA. An autoencoder can use non-linear activations and multiple layers, so it generalises PCA from a flat linear subspace to curved manifolds, giving far greater representational power. Trade-offs: PCA has a closed-form, deterministic solution with ordered components and is easy to interpret, whereas a non-linear autoencoder is more flexible but trained by gradient descent and, if too powerful, risks simply copying the input — hence the need for regularisation (Q19).",
    "skeleton": [
      "선형 AE(은닉1·선형·MSE) = PCA. 비선형 AE는 PCA의 비선형 일반화(매니폴드).",
      "PCA — 선형 부분공간, 닫힌 해, 정렬된 성분, 해석 쉬움.",
      "AE — 비선형·깊이로 표현력↑, 단 항등 학습 위험 → 정칙화 필요."
    ],
    "modelKo": "둘 다 입력을 저차원 코드로 압축하고 복원한다. PCA는 분산이 가장 큰 직교 방향들을 찾아 그 부분공간으로 선형 사영한다; 결정적으로 은닉층 하나에 선형 활성과 제곱오차 손실을 쓴 오토인코더는 PCA와 같은 부분공간을 배우므로, 선형 오토인코더 = PCA다. 오토인코더는 비선형 활성과 다층을 쓸 수 있어 PCA를 평평한 선형 부분공간에서 휘어진 다양체(manifold)로 일반화하며 훨씬 큰 표현력을 준다. 트레이드오프: PCA는 닫힌형 결정론적 해에 성분이 순서대로 정렬되고 해석이 쉬운 반면, 비선형 오토인코더는 더 유연하지만 경사하강으로 학습하고 너무 강하면 입력을 그대로 복사할 위험이 있어 정칙화(Q19)가 필요하다."
  },
  {
    "q": 19,
    "step": 21,
    "emoji": "🧭",
    "part": 5,
    "partName": "비지도 학습과 표상",
    "partEmoji": "🧭",
    "title": "정칙화된 오토인코더(regularized autoencoders)",
    "qtext": "Why do we need regularized autoencoders and how can we make them?",
    "modelEn": "Why: an autoencoder with enough capacity — especially an over-complete one whose hidden layer is at least as large as the input — can simply learn the identity function, copying input to output with zero reconstruction error while learning nothing useful. Regularisation imposes an additional objective beyond reconstruction so a useful representation is learned regardless of capacity. How: (1) a sparse autoencoder adds a sparsity penalty on the hidden activations, forcing most units to zero and learning parts-based features; (2) a denoising autoencoder corrupts the input and trains the network to reconstruct the clean version, so copying is impossible and it must learn the data manifold; (3) a contractive autoencoder penalises how much the code changes when the input changes slightly (the Jacobian norm), making the code insensitive to small input changes and sensitive only along the manifold.",
    "skeleton": [
      "필요 이유 — 용량 큰 AE는 항등함수를 외워 복사만 함(배움 0). 복원 외 목표를 부과해야 유용 표현.",
      "희소 — 은닉 활성에 희소성 벌점(parts-based 표현). 잡음제거(DAE) — 손상 입력→깨끗 복원(데이터 manifold 학습).",
      "수축(CAE) — 입력 변화에 따른 code 변화량 벌점으로 입력 잡음에 둔감, manifold 접선 방향만 민감."
    ],
    "modelKo": "왜: 용량이 충분한 오토인코더 — 특히 은닉층이 입력 이상인 과완비(over-complete) — 는 항등 함수를 배워 입력을 출력으로 복사해 재구성 오차 0이지만 아무것도 유용하게 배우지 못한다. 정칙화는 재구성 외의 추가 목표를 부과해 용량과 무관하게 유용한 표상을 배우게 한다. 어떻게: (1) 희소 오토인코더는 은닉 활성에 희소성 벌점을 더해 대부분 유닛을 0으로 만들고 부분 기반 특징을 배운다; (2) 잡음 제거(denoising) 오토인코더는 입력을 손상시키고 깨끗한 버전을 복원하도록 학습해 복사가 불가능하고 데이터 다양체를 배워야 한다; (3) 수축(contractive) 오토인코더는 입력이 조금 변할 때 코드가 얼마나 변하는지(야코비안 노름)에 벌점을 줘 코드를 작은 입력 변화에 둔감하고 다양체 방향으로만 민감하게 만든다."
  },
  {
    "q": 20,
    "step": 22,
    "emoji": "🧭",
    "part": 5,
    "partName": "비지도 학습과 표상",
    "partEmoji": "🧭",
    "title": "비지도 학습이 다운스트림 과제를 돕는 이유",
    "qtext": "Why is unsupervised learning helpful for the downstream tasks like classification?",
    "modelEn": "The core assumption is that the structure of the input distribution carries information about the label distribution: the factors of variation that shape the inputs overlap substantially with the factors we want to predict. Examples of one class cluster together or lie on a shared manifold, and unsupervised learning discovers these clusters, manifolds and factors without labels, producing a good representation of the input in which the decision boundary becomes simple — so the downstream classifier needs fewer labels and generalises better. In practice it is used as pre-training/initialisation (learn from abundant unlabelled data, then fine-tune) or as semi-supervised shared representations, e.g. word embeddings from a language model or edges and textures from an autoencoder. The caveat: it helps only when the unsupervised features are actually relevant to the label — if the input distribution structure and the label predictor are unrelated, it may not help.",
    "skeleton": [
      "핵심 — 입력 분포 구조가 라벨에 대한 정보를 담음. 군집/매니폴드/변동 인자가 라벨과 겹침.",
      "비지도 학습이 좋은 표현을 발견 → 그 표현 공간에서 분류 단순화, 적은 라벨로 일반화.",
      "실무 — 사전훈련/초기화 + 반지도 학습. 예: BERT 단어 임베딩, autoencoder 시각 특징. 단 비지도 특징이 라벨과 관련될 때만 효과."
    ],
    "modelKo": "핵심 가정은 입력 분포의 구조가 라벨 분포에 대한 정보를 담는다는 것이다: 입력을 빚는 변동 요인이 우리가 예측하려는 요인과 상당히 겹친다. 한 클래스의 표본들은 함께 모이거나 공유 다양체 위에 놓이고, 비지도 학습은 라벨 없이 이 군집, 다양체, 요인을 발견해 결정 경계가 단순해지는 좋은 입력 표상을 만든다 — 그래서 다운스트림 분류기가 더 적은 라벨로 더 잘 일반화한다. 실무에선 사전훈련/초기화(풍부한 비라벨 데이터에서 배우고 미세조정)나 준지도 공유 표상으로 쓰며, 언어모델의 단어 임베딩이나 오토인코더의 에지/질감이 예다. 단서: 비지도 특징이 실제로 라벨과 관련 있을 때만 도움이 된다 — 입력 분포 구조와 라벨 예측기가 무관하면 도움이 안 될 수 있다."
  },
  {
    "q": 21,
    "step": 23,
    "emoji": "🧭",
    "part": 5,
    "partName": "비지도 학습과 표상",
    "partEmoji": "🧭",
    "title": "분산 표상(distributed representation) — compact vs sparse",
    "qtext": "What is distributed representation? Why is it so important in deep learning? Compare compact and sparse representations.",
    "modelEn": "A distributed representation encodes a concept as a pattern of activity over many units, with each unit helping to represent many concepts; the opposite is a local (one-hot) representation, one unit per concept. It matters because its capacity is exponential: n binary features can distinguish up to 2 to the n regions, whereas n local units distinguish only n. This is the source of generalisation — features are reused across concepts, so having seen \"red car\" and \"blue truck\" the model generalises to an unseen \"red truck\" — and the statistical efficiency (linearly many parameters describing exponentially many regions) behind deep learning. Comparing the modes: local (exactly one unit active; n concepts; no reuse; most interpretable), dense/compact distributed (many units active; capacity up to 2 to the n; maximal efficiency but entangled and hard to interpret), and sparse distributed (k of n active; capacity is the number of ways to choose k from n — still huge, but more interpretable, robust, and energy-efficient) — a trade-off between capacity, interpretability, and robustness.",
    "skeleton": [
      "분산 표상 — 개념=여러 유닛의 패턴, 각 유닛=여러 개념에 참여. 반대 = 국소/원-핫.",
      "중요성 — n개 특징으로 2^n 개 영역 구별 가능, 특징 재사용으로 본 적 없는 조합에 일반화. n개 파라미터로 2^n 개 영역을 기술하는 통계적 효율.",
      "비교 — 국소(1개 활성, 해석 쉬움, 용량 작음) / 조밀(다수 활성, 용량 최대, 특징 얽힘) / 희소(k개 활성, 용량 크면서 해석·강건성·생물학적 유사)."
    ],
    "modelKo": "분산 표상(distributed representation)은 한 개념을 여러 유닛에 걸친 활성 패턴으로 부호화하고 각 유닛은 여러 개념 표현에 기여한다; 반대는 개념당 유닛 하나인 국소(one-hot) 표상이다. 중요한 이유는 용량이 지수적이기 때문이다: n개 이진 특징은 최대 2의 n제곱 영역을 구분하지만 n개 국소 유닛은 n개만 구분한다. 이것이 일반화의 원천이며 — 특징이 개념 간 재사용되어 '빨간 차'와 '파란 트럭'을 본 모델이 못 본 '빨간 트럭'으로 일반화 — 딥러닝을 떠받치는 통계적 효율(선형 개수의 파라미터로 지수적 개수의 영역 기술)이다. 모드 비교: 국소(정확히 한 유닛 활성; n개 개념; 재사용 없음; 해석 최고), 조밀/콤팩트 분산(많은 유닛 활성; 용량 최대 2의 n제곱; 효율 최대지만 얽혀 해석 어려움), 희소 분산(n 중 k 활성; 용량은 n에서 k를 고르는 경우의 수 — 여전히 거대하지만 더 해석 가능, 강건, 에너지 효율적) — 용량, 해석성, 강건성 사이의 트레이드오프다."
  },
  {
    "q": 24,
    "step": 24,
    "emoji": "📜",
    "part": 6,
    "partName": "핵심 논문",
    "partEmoji": "📜",
    "title": "“A Neural Algorithm of Artistic Style”",
    "qtext": "What is the main point of the “A Neural Algorithm of Artistic Style” paper?",
    "modelEn": "The single point is that an image's content (what is where) and its style (texture and colour statistics) can be separated inside the features of a pretrained CNN, and therefore recombined — letting you repaint a photo in any artist's style. Using a fixed VGG network, content is captured by the activations of a deep layer (deep layers discard pixel detail and keep structure), whereas style is captured by the Gram matrix — the correlations between feature maps — taken at several layers, which encodes texture statistics with no spatial location. A new image is then generated by gradient descent on the pixels themselves to minimise a weighted sum of a content loss and a style (Gram) loss, where the two weights control how much each side dominates, while the network stays fixed.",
    "skeleton": [
      "핵심 — CNN 특징 안에서 콘텐츠와 스타일을 분리·재조합.",
      "콘텐츠 = 깊은 층 활성(무엇이 어디에). 스타일 = 그람 행렬(특징 상관 = 위치 없는 질감 통계).",
      "고정 CNN, 두 손실의 합을 줄이도록 픽셀을 경사하강으로 최적화해 생성."
    ],
    "modelKo": "단 하나의 핵심은, 이미지의 콘텐츠(무엇이 어디에 있는가)와 스타일(질감과 색 통계)을 사전학습된 CNN의 특징 안에서 분리할 수 있고 따라서 재결합할 수 있다는 것이다 — 사진을 어떤 화가의 화풍으로 다시 그리게 해 준다. 고정된 VGG 네트워크를 써서, 콘텐츠는 깊은 층의 활성으로 포착하고(깊은 층은 픽셀 디테일을 버리고 구조를 유지), 스타일은 여러 층에서의 그람 행렬(Gram matrix) — 특징맵 간 상관 — 로 포착하는데 이는 공간 위치 없이 질감 통계를 부호화한다. 그 뒤 콘텐츠 손실과 스타일(그람) 손실의 가중합을 최소화하도록 픽셀 자체에 경사하강해 새 이미지를 생성하며, 두 가중치가 어느 쪽이 얼마나 지배할지 조절하고 네트워크는 고정된 채로 둔다."
  },
  {
    "q": 25,
    "step": 25,
    "emoji": "📜",
    "part": 6,
    "partName": "핵심 논문",
    "partEmoji": "📜",
    "title": "“Attention Is All You Need”",
    "qtext": "What is the main point of the “Attention is all you need” paper?",
    "modelEn": "The single point is that sequences can be modelled without any recurrence or convolution, using only (self-)attention — the Transformer. Self-attention computes, for each position, a weighted sum of all positions' values, where the weights come from the softmax of query-key similarities. This matters because it overcomes the two limits of RNNs and CNNs at once: any two positions are connected directly in a single step (path length is constant), so long-range dependencies are captured with no vanishing gradients and no stacked depth; and all positions are computed in parallel with no sequential dependency, making GPU training far faster. Because order information is otherwise lost, positional encoding is added, and multi-head attention lets the model attend to several relationships at once.",
    "skeleton": [
      "핵심 — 순환/합성곱 없이 셀프 어텐션만으로 시퀀스 모델링(Transformer).",
      "Query, Key, Value 세 표현으로 모든 위치 쌍을 직접 연결. Query-Key 유사도를 가중치로 Value를 합산.",
      "이점 — 긴 의존성 path 1, 완전 병렬 계산. 보조 장치 = positional encoding (순서 주입), multi-head attention (여러 관계 동시)."
    ],
    "modelKo": "단 하나의 핵심은, 순환이나 합성곱 없이 오직 (셀프) 어텐션만으로 시퀀스를 모델링할 수 있다는 것 — 트랜스포머(Transformer)다. 셀프 어텐션은 각 위치에 대해 모든 위치 값의 가중합을 계산하며, 가중치는 쿼리-키 유사도의 소프트맥스에서 나온다. 이것이 중요한 이유는 RNN과 CNN의 두 한계를 한 번에 극복하기 때문이다: 임의의 두 위치가 단 한 단계로 직접 연결되어(경로 길이 상수) 기울기 소실 없이, 깊이를 쌓지 않고 장기 의존성을 포착하며; 모든 위치가 순차 의존성 없이 병렬로 계산되어 GPU 학습이 훨씬 빠르다. 순서 정보가 사라지므로 위치 인코딩(positional encoding)을 더하고, 멀티헤드 어텐션이 여러 관계를 동시에 주목하게 한다."
  },
  {
    "q": 26,
    "step": 26,
    "emoji": "📜",
    "part": 6,
    "partName": "핵심 논문",
    "partEmoji": "📜",
    "title": "BERT vs GPT",
    "qtext": "Compare BERT and GPT in terms of the Transformer architecture. And when can we use BERT or GPT?",
    "modelEn": "Both are built from the Transformer but use different halves and objectives. BERT is a Transformer encoder with bidirectional self-attention (each token sees both left and right context), trained by masked language modelling (predict masked tokens) plus next-sentence prediction; it excels at understanding tasks that need full context — classification, named-entity recognition, extractive question answering, sentence embeddings — but is not naturally generative. GPT is a Transformer decoder with unidirectional (causally masked) self-attention (each token sees only previous tokens), trained as an autoregressive language model (predict the next token); it excels at generation — completion, dialogue, open-ended and few-shot tasks. In short: use BERT for understanding/encoding tasks and GPT for generation.",
    "skeleton": [
      "공통 Transformer. BERT = 인코더·양방향·마스크LM, GPT = 디코더·단방향(인과)·자기회귀LM.",
      "BERT는 전체 문맥 이해(분류·NER·QA·임베딩), GPT는 생성(이어쓰기·대화·few-shot).",
      "고르는 기준 — 이해 과제면 BERT, 생성 과제면 GPT."
    ],
    "modelKo": "둘 다 트랜스포머로 만들어졌지만 다른 절반과 목표를 쓴다. BERT는 양방향 셀프 어텐션을 가진 트랜스포머 인코더로(각 토큰이 좌우 문맥을 모두 봄), 마스크 언어모델링(가려진 토큰 예측)과 다음 문장 예측으로 학습한다; 전체 문맥이 필요한 이해 과제 — 분류, 개체명 인식, 추출형 질의응답, 문장 임베딩 — 에 강하지만 본질적으로 생성형은 아니다. GPT는 단방향(인과 마스크) 셀프 어텐션을 가진 트랜스포머 디코더로(각 토큰이 이전 토큰만 봄), 자기회귀 언어모델(다음 토큰 예측)로 학습한다; 생성 — 완성, 대화, 개방형 및 퓨샷 과제 — 에 강하다. 요약하면, 이해/인코딩 과제엔 BERT, 생성엔 GPT를 쓴다."
  }
];
