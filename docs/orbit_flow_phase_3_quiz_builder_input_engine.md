# OrbitFlow SaaS CRM — Phase 3: The Quiz Builder (Input Engine)

> **الهدف**: بناء محرك استبيانات ديناميكي كامل — من **Builder للمدير** إلى **صفحة عامة للتقديم** إلى **محرك عرض خطوة بخطوة** مع **Pixel injection** و **Server Action للإرسال** تشمل كشف التكرار + حساب النقاط.

---

## 0) Architectural Decisions

- **Pixel IDs** تُخزّن داخل `config.tracking` (JSON) — بدون أعمدة جديدة.
- **Duplicate leads**: Upsert (تحديث الموجود + إلحاق الاستجابات + الاحتفاظ بأعلى Score).
- **Step model**: سؤال واحد لكل خطوة افتراضيًا، مع إمكانية التجميع عبر `group`.
- **Animations**: CSS transitions فقط (بدون مكتبات).
- **Builder State**: محلي بـ `useState` والحفظ **عند الضغط فقط**.

---

## 1) TypeScript Interfaces

### File
- `src/types/quiz.ts`

### 1.1 Question Types

| النوع | الوصف | الحقول الخاصة |
|---|---|---|
| `text` | حقل نصي | `placeholder`, `maxLength`, `multiline` |
| `radio` | اختيار واحد | `options[{label,value,score(0-10)}]`, `layout` (vertical/horizontal/cards) |
| `image_grid` | شبكة صور | `options[{label,value,score,imageUrl}]`, `columns` (2/3/4) |
| `email` | بريد إلكتروني | `placeholder` |
| `phone` | رقم هاتف | `placeholder`, `countryCode` |
| `name` | اسم أول/أخير | `firstNamePlaceholder`, `lastNamePlaceholder` |

### 1.2 BaseQuestion

- `id`, `type`, `questionText`, `description?`, `required`, `weight (1-10)`, `group?`

### 1.3 QuizConfig (stored in `Quiz.config` JSON)

```ts
export interface QuizConfig {
  version: 1;
  questions: QuizQuestion[];
  settings: QuizSettings;
  tracking: QuizTracking;
  welcomeScreen: QuizWelcomeScreen;
}
```

### 1.4 Response Types

```ts
export interface QuizResponse {
  questionId: string;
  questionText: string;
  questionType: QuizQuestionType;
  answer: unknown;
  selectedOptionId?: string;
}

export interface QuizSubmissionData {
  quizId: string;
  responses: QuizResponse[];
  startedAt: string;
  completedAt: string;
}

export interface ExtractedContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
```

---

## 2) Zod Validation Schemas

### File
- `src/lib/validators/quiz-schema.ts`

### المطلوب
- `quizConfigSchema` للتحقق عند الحفظ (Admin)
- `quizSubmissionSchema` للتحقق عند الإرسال (Public)
- استخدام:

```ts
z.discriminatedUnion("type", [ /* question schemas */ ])
```

---

## 3) Quiz Utilities

### 3.1 Scoring

File: `src/lib/quiz/scoring.ts`

**Rules**:
- Radio / ImageGrid:
  - `earned += weight * selectedOption.score`
- Text / Email / Phone / Name:
  - إذا تمت الإجابة → `earned += weight * 1`

**Final**:

```text
finalScore = round((earnedPoints / maxPoints) * 100)
```

### 3.2 Contact Extraction

File: `src/lib/quiz/extraction.ts`
- استخراج `firstName, lastName, email, phone` حسب نوع السؤال
- تطبيع الهاتف (على الأقل trimming + تحويل رموز)

### 3.3 Server-side Validation

File: `src/lib/quiz/validation.ts`
- التأكد من الإجابة على required
- التحقق من صيغة email/phone/name

### 3.4 Config Helpers

File: `src/lib/quiz/config-helpers.ts`
- `createDefaultQuestion(type)`
- `createDefaultQuizConfig()`

---

## 4) Schema Changes

### Prisma change
في `model Lead`:

```prisma
@@index([companyId, phone])
```

> الهدف: تسريع البحث عن العملاء المكررين.

---

## 5) Server Actions

### 5.1 Protected CRUD Actions

File: `src/actions/quiz/quiz-crud.ts`

> محمي بـ `getTenant()` + `hasMinimumRole()`

| الإجراء | الدور المطلوب | الوصف |
|---|---|---|
| `createQuiz(title, slug)` | MANAGER+ | إنشاء Quiz بـ config افتراضي |
| `updateQuizConfig(quizId, config)` | MANAGER+ | حفظ config مع Zod validation |
| `updateQuizMeta(quizId, data)` | MANAGER+ | تحديث title/slug/colors |
| `togglePublish(quizId)` | MANAGER+ | نشر/إلغاء نشر (يتطلب سؤال واحد على الأقل) |
| `deleteQuiz(quizId)` | OWNER+ | حذف الاستبيان |

### 5.2 Public Submission Action

File: `src/actions/quiz/submit-quiz.ts`

**Flow**:
1) Fetch quiz by id + ensure `isPublished && isActive` + `company.isActive`
2) `validateSubmission(responses)`
3) `extractContactInfo(responses)`
4) `calculateLeadScore(config, responses)`
5) Find duplicate lead by `companyId + phone`
6a) If duplicate: update lead:
   - append quizResponses
   - keep max score
   - update contact info
6b) else create lead:
   - `status=NEW`, `source="quiz"`
7) Return `{ success, leadId }`

---

## 6) Admin Builder UI (Protected)

### Pages
- `src/app/(dashboard)/quizzes/page.tsx` (List)
- `src/app/(dashboard)/quizzes/new/page.tsx` (Create)
- `src/app/(dashboard)/quizzes/[quizId]/page.tsx` (Builder Shell)
- `src/app/(dashboard)/quizzes/[quizId]/preview/page.tsx` (Preview)

### Layout: 3 Panels

```text
+-------------------+------------------------+------------------+
| قائمة الأسئلة      | محرر السؤال المحدد       | إعدادات الاستبيان   |
| (شريط جانبي)       | (اللوحة الرئيسية)        | (لوحة قابلة للطي)   |
| [+ إضافة سؤال]    |                        | عام | سلوك | تتبع |
+-------------------+------------------------+------------------+
```

### Components (src/components/quiz-builder/)

| المكون | الوصف |
|---|---|
| `quiz-builder-shell.tsx` | يدير `QuizConfig` في الذاكرة |
| `question-list.tsx` | قائمة عمودية + إعادة ترتيب (up/down) |
| `question-list-item.tsx` | عنصر سؤال (أيقونة النوع + حذف) |
| `question-type-selector.tsx` | Dropdown لاختيار النوع |
| `question-editor.tsx` | يختار المحرر حسب النوع |
| `editors/*.tsx` | 6 محررات حسب الأنواع |
| `option-editor.tsx` | صف خيار قابل لإعادة الاستخدام |
| `quiz-settings-panel.tsx` | Tabs: عام / سلوك / تتبع |
| `publish-controls.tsx` | حفظ / نشر / معاينة / نسخ الرابط |

---

## 7) Public Quiz Route

### Route
- `src/app/q/[companySlug]/[quizSlug]/page.tsx`

### Behavior
- Public (بدون auth)
- Server Component:
  - Fetch quiz via `company.slug + quiz.slug`
  - Ensure `isPublished && isActive && company.isActive`
  - Generate dynamic metadata (SEO + OpenGraph)
  - Wrap in `PixelProvider`
  - Pass config to `QuizRenderer`

---

## 8) Quiz Rendering Engine

### Main
- `src/components/quiz-renderer/quiz-renderer.tsx` (Client)

### State Machine Hook
- `src/components/quiz-renderer/use-quiz-state.ts`

#### Manages
- `currentStep`, `totalSteps`, `phase`, `direction`
- `responses (Map)`, `validationErrors (Map)`
- `goNext()`, `goBack()`, `setResponse()`, `canGoNext`
- grouping via `group`
- validate step before advance

### UI Components (src/components/quiz-renderer/)

| Component | Description |
|---|---|
| `quiz-progress-bar.tsx` | شريط تقدم متحرك |
| `quiz-navigation.tsx` | رجوع/تالي/إرسال |
| `quiz-welcome-screen.tsx` | شاشة ترحيب اختيارية |
| `quiz-thank-you-screen.tsx` | شكر + redirect اختياري |
| `quiz-summary-step.tsx` | مراجعة قبل الإرسال (اختياري) |
| `question-step.tsx` | غلاف السؤال مع animation (slide+fade) |
| `renderers/*.tsx` | 6 renderers حسب النوع |

### Design Guidelines
- Mobile-first
- Card centered (light/dark)
- Branding عبر CSS var: `--quiz-primary`
- خلفية قابلة للتخصيص (صورة/تدرج)

---

## 9) Pixel Injection

### Provider
- `src/components/tracking/pixel-provider.tsx`

Provides:
- `firePageView()`
- `fireCompleteRegistration()`

### Facebook Pixel
- `src/components/tracking/facebook-pixel.tsx`
- `next/script` strategy=`afterInteractive`
- `fbq('init', pixelId)` + `fbq('track', 'PageView')`

### TikTok Pixel
- `src/components/tracking/tiktok-pixel.tsx`
- `ttq.load(pixelId)` + `ttq.page()`

### Events Flow
- Quiz Load → `PageView`
- Submit Success → `CompleteRegistration`

---

## 10) File Tree (Phase 3)

```text
src/
├── types/
│   └── quiz.ts
├── lib/
│   ├── quiz/
│   │   ├── scoring.ts
│   │   ├── extraction.ts
│   │   ├── validation.ts
│   │   └── config-helpers.ts
│   └── validators/
│       └── quiz-schema.ts
├── actions/quiz/
│   ├── quiz-crud.ts
│   └── submit-quiz.ts
├── app/
│   ├── (dashboard)/quizzes/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [quizId]/
│   │       ├── page.tsx
│   │       └── preview/page.tsx
│   └── q/[companySlug]/[quizSlug]/
│       ├── page.tsx
│       └── loading.tsx
├── components/
│   ├── quiz-builder/
│   │   ├── quiz-builder-shell.tsx
│   │   ├── question-list.tsx
│   │   ├── question-list-item.tsx
│   │   ├── question-type-selector.tsx
│   │   ├── question-editor.tsx
│   │   ├── editors/ (6 files)
│   │   ├── option-editor.tsx
│   │   ├── quiz-settings-panel.tsx
│   │   ├── publish-controls.tsx
│   │   └── quiz-preview-button.tsx
│   ├── quiz-renderer/
│   │   ├── quiz-renderer.tsx
│   │   ├── use-quiz-state.ts
│   │   ├── quiz-progress-bar.tsx
│   │   ├── quiz-navigation.tsx
│   │   ├── quiz-welcome-screen.tsx
│   │   ├── quiz-thank-you-screen.tsx
│   │   ├── quiz-summary-step.tsx
│   │   ├── question-step.tsx
│   │   └── renderers/ (6 files)
│   └── tracking/
│       ├── pixel-provider.tsx
│       ├── facebook-pixel.tsx
│       └── tiktok-pixel.tsx
```

> تقدير الملفات الجديدة: ~47 ملف.

---

## 11) Verification Checklist

- [ ] Builder: إنشاء Quiz جديد → إضافة أسئلة متنوعة → حفظ → نشر
- [ ] Public Link: فتح الرابط في نافذة incognito → يعمل بدون تسجيل دخول
- [ ] Rendering: تنقل + progress bar + animations سليمة
- [ ] Submission: إكمال الاستبيان → Thank you → Lead جديد في DB
- [ ] Duplicate: نفس الهاتف مرتين → تحديث Lead الموجود (بدون إنشاء جديد)
- [ ] Score: `Lead.score` محسوب صحيحًا
- [ ] Pixels: DevTools/Network → تحميل `fbevents.js` و TikTok events
- [ ] Mobile: تجربة على شاشة هاتف → responsive
- [ ] Validation: محاولة إرسال بدون required → رسائل خطأ
- [ ] Draft: quiz غير منشور → public route يعرض 404

---

✅ **Phase 3 مكتملة عند نجاح جميع عناصر Verification Checklist.**

