// useAccessibility.ts
import { useState, useEffect } from 'react';

type ColorScheme = 'default' | 'black-white' | 'white-black' | 'blue-beige';
type FontSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityState {
  isEnabled: boolean;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  imagesEnabled: boolean;
}

const defaultState: AccessibilityState = {
  isEnabled: false,
  colorScheme: 'default',
  fontSize: 'normal',
  imagesEnabled: true,
};

export const useAccessibility = () => {
  // Читаем из localStorage при старте
  const [state, setState] = useState<AccessibilityState>(() => {
    const saved = localStorage.getItem('a11y-settings');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('a11y-settings', JSON.stringify(state));
    applyStylesToBody(state);
  }, [state]);

  const toggleMode = () => {
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setState((prev) => ({ ...prev, colorScheme: scheme, isEnabled: true }));
  };

  const setFontSize = (size: FontSize) => {
    setState((prev) => ({ ...prev, fontSize: size, isEnabled: true }));
  };

  const toggleImages = () => {
    setState((prev) => ({ ...prev, imagesEnabled: !prev.imagesEnabled }));
  };

  return { state, toggleMode, setColorScheme, setFontSize, toggleImages };
};

// Функция применения классов к body
const applyStylesToBody = (state: AccessibilityState) => {
  const body = document.body;
  
  // Сброс всех классов
  body.classList.remove(
    'a11y-enabled',
    'a11y-black-white',
    'a11y-white-black',
    'a11y-blue-beige',
    'a11y-font-large',
    'a11y-font-xlarge',
    'a11y-no-images'
  );

  if (!state.isEnabled) return;

  body.classList.add('a11y-enabled');

  if (state.colorScheme === 'black-white') body.classList.add('a11y-black-white');
  if (state.colorScheme === 'white-black') body.classList.add('a11y-white-black');
  if (state.colorScheme === 'blue-beige') body.classList.add('a11y-blue-beige');

  if (state.fontSize === 'large') body.classList.add('a11y-font-large');
  if (state.fontSize === 'xlarge') body.classList.add('a11y-font-xlarge');

  if (!state.imagesEnabled) body.classList.add('a11y-no-images');
};