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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
];
