# PWA Icons - Generation Instructions

## Required Icons

The manifest.json references the following PWA icons:
- `icon-192.png` - 192x192px (any purpose)
- `icon-512.png` - 512x512px (any purpose)
- `icon-maskable-512.png` - 512x512px (maskable purpose)

## How to Generate Icons

### Option 1: Use PWA Asset Generator (Recommended)

```bash
npx @vite-pwa/assets-generator --preset minimal public/logo.svg public/icons
```

### Option 2: Use Online Tool

Visit: https://realfavicongenerator.net/
1. Upload your logo/icon (512x512px recommended)
2. Configure for PWA
3. Download and extract to `public/icons/`

### Option 3: Use ImageMagick (Manual)

If you have a source logo at `public/logo.png`:

```bash
# Create 192x192 icon
magick convert public/logo.png -resize 192x192 public/icons/icon-192.png

# Create 512x512 icon
magick convert public/logo.png -resize 512x512 public/icons/icon-512.png

# Create maskable 512x512 icon (with safe zone padding)
magick convert public/logo.png -resize 410x410 -gravity center -extent 512x512 -background transparent public/icons/icon-maskable-512.png
```

### Option 4: Design in Figma/Canva

1. Create 512x512px artboard
2. Design your app icon
3. Export as PNG at 1x, 2x
4. Rename files to match manifest requirements

## Icon Requirements

### Standard Icons (any purpose)
- Simple, recognizable design
- Clear at small sizes
- No text (or minimal text)
- Solid background OR transparent with clear contrast

### Maskable Icons
- Must have safe zone (20% padding on all sides)
- Content should fit in center 80% circle
- Usually has full-bleed background color
- See: https://maskable.app/editor

## Temporary Solution (For Development)

If you don't have icons yet, you can create simple placeholder SVGs or use a favicon generator online.

## Brand Colors

Current theme:
- Primary: `#6366f1` (Indigo)
- Background: `#0f172a` (Slate)

## Testing

After generating icons:
1. Clear browser cache
2. Reload app
3. Check console for 404 errors
4. Test PWA install prompt
5. Verify icons appear in installed app

## Resources

- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
- [Maskable Icon Editor](https://maskable.app/editor)
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://github.com/vite-pwa/assets-generator)
