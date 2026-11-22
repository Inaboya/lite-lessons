export const canSpeak = () => 'speechSynthesis' in window

export function speak(text: string, onEnd?: () => void) {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.9
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}

export const stopSpeaking = () => window.speechSynthesis.cancel()