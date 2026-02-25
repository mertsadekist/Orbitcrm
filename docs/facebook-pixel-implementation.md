# Facebook Pixel & TikTok Pixel Implementation

## Overview
The quiz system already has complete Facebook Pixel and TikTok Pixel tracking functionality built-in. No additional implementation was needed.

## Implementation Status: ✅ COMPLETE

### 1. **Quiz Settings UI** - ✅ Working
**Location:** [src/components/quiz-builder/quiz-settings-panel.tsx](src/components/quiz-builder/quiz-settings-panel.tsx)

The "Tracking" tab in quiz settings includes:
- **Facebook Pixel ID** input field (lines 162-180)
- **TikTok Pixel ID** input field (lines 182-200)
- Helpful descriptions for each field
- Stored in `config.tracking.facebookPixelId` and `config.tracking.tiktokPixelId`

### 2. **Data Storage** - ✅ Working
**Location:** Prisma Schema

Tracking IDs are stored in the `Quiz` model's `config` JSON field:
```typescript
config: {
  tracking: {
    facebookPixelId?: string;
    tiktokPixelId?: string;
  }
}
```

### 3. **Pixel Loading** - ✅ Working
**Location:** [src/app/q/[companySlug]/[quizSlug]/page.tsx](src/app/q/[companySlug]/[quizSlug]/page.tsx)

Public quiz pages automatically load pixels via `PixelProvider` component:
```tsx
<PixelProvider tracking={config.tracking}>
  <QuizRenderer {...props} />
</PixelProvider>
```

### 4. **Pixel Provider** - ✅ Working
**Location:** [src/components/tracking/pixel-provider.tsx](src/components/tracking/pixel-provider.tsx)

Features:
- Conditionally renders FacebookPixel and TikTokPixel components
- Provides tracking hooks: `firePageView()` and `fireCompleteRegistration()`
- Context-based API for child components to trigger events

### 5. **Facebook Pixel Script** - ✅ Working
**Location:** [src/components/tracking/facebook-pixel.tsx](src/components/tracking/facebook-pixel.tsx)

- Uses Next.js `Script` component with `afterInteractive` strategy
- Properly initializes Facebook Pixel with provided ID
- Automatically fires PageView event on load
- Exposes `window.fbq` for custom events

### 6. **TikTok Pixel Script** - ✅ Working
**Location:** [src/components/tracking/tiktok-pixel.tsx](src/components/tracking/tiktok-pixel.tsx)

- Similar implementation to Facebook Pixel
- Initializes TikTok Pixel with provided ID
- Exposes `window.ttq` for custom events

## How to Use

### For Quiz Creators:

1. **Navigate to Quiz Builder**
   - Go to `/quizzes` and select a quiz
   - Or create a new quiz at `/quizzes/new`

2. **Open Settings Panel**
   - Click on the "Settings" panel (right side of quiz builder)
   - Switch to the **"Tracking"** tab

3. **Enter Pixel IDs**
   - **Facebook Pixel ID**: Enter your Facebook Ads Pixel ID
   - **TikTok Pixel ID**: Enter your TikTok Ads Pixel ID
   - Save the quiz

4. **Publish Quiz**
   - Click "Publish" to make the quiz live
   - Pixels will automatically load on the public quiz page

### Tracked Events:

1. **PageView** - Fires when quiz page loads
2. **CompleteRegistration** - Fires when user submits quiz

## Event Triggers

Components can use the pixel context to fire custom events:

```typescript
import { usePixel } from "@/components/tracking/pixel-provider";

function MyComponent() {
  const { fireCompleteRegistration, firePageView } = usePixel();

  // Fire when quiz is completed
  const handleQuizComplete = () => {
    fireCompleteRegistration();
  };

  return <button onClick={handleQuizComplete}>Submit</button>;
}
```

## Technical Details

### Pixel Initialization Flow:
1. User visits public quiz: `/q/{company}/{quiz}`
2. Server fetches quiz with `config.tracking` data
3. `PixelProvider` wraps quiz renderer
4. If `facebookPixelId` exists, `FacebookPixel` component renders
5. If `tiktokPixelId` exists, `TikTokPixel` component renders
6. Scripts load asynchronously using Next.js Script optimization
7. PageView event fires automatically
8. Quiz submission triggers CompleteRegistration event

### Performance:
- Scripts load with `afterInteractive` strategy (optimal for 3rd-party scripts)
- No impact on First Contentful Paint (FCP)
- Lazy-loaded only when pixel IDs are configured

### Privacy & GDPR:
- Pixels only load when explicitly configured by quiz creator
- No cookies or tracking when pixel IDs are not set
- Quiz creators are responsible for their own privacy policies

## Files Involved

| File | Purpose |
|------|---------|
| `src/components/quiz-builder/quiz-settings-panel.tsx` | UI for entering pixel IDs |
| `src/components/tracking/pixel-provider.tsx` | Context provider for tracking |
| `src/components/tracking/facebook-pixel.tsx` | Facebook Pixel script loader |
| `src/components/tracking/tiktok-pixel.tsx` | TikTok Pixel script loader |
| `src/app/q/[companySlug]/[quizSlug]/page.tsx` | Public quiz page with pixel integration |
| `src/types/quiz.ts` | TypeScript types for tracking config |

## Build Status
✅ Clean build, all functionality working correctly

## Additional Notes

- React key warning in RadioRenderer: The component already has proper `key={option.id}` props. If the warning persists, it may be due to duplicate IDs in quiz options data.
- Tracking is completely optional - quizzes work fine without pixel IDs
- Multiple pixels can be active simultaneously (Facebook + TikTok)
