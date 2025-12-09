import localFont from 'next/font/local';

// PASSION ONE - Primary heading font (bold, display)
export const passionOne = localFont({
  src: [
    {
      path: '../brand guideline/Fonts/PassionOne-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-passion-one',
  display: 'swap',
  adjustFontFallback: false,
  preload: true,
});

// Noto Sans - Body text font (semi-bold primary)
export const notoSans = localFont({
  src: [
    {
      path: '../brand guideline/Fonts/NotoSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../brand guideline/Fonts/NotoSans-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-noto-sans',
  display: 'swap',
  adjustFontFallback: false,
  preload: true,
});

// Open Sans - Alternative/supplementary font
export const openSans = localFont({
  src: [
    {
      path: '../brand guideline/Fonts/OpenSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-open-sans',
  display: 'swap',
  adjustFontFallback: false,
  preload: true,
});
