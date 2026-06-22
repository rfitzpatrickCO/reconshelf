// Motivational phrases shown on the loading screen (app launch + when logging
// reading). Add more lines here anytime — one quote per entry, no trailing punctuation needed.
export const LOADING_PHRASES = [
  'Strength and Honor',
  'Slow is smooth. Smooth is fast',
  'Always improve your fighting position',
  'When you put down the gun... Walk away',
  "Don't let the old man in",
]

export function randomPhrase() {
  return LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]
}
