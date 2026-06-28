import useSound from 'use-sound'

// Using simple remote URLs for sound effects so we don't need local files.
const POP_SOUND = 'https://actions.google.com/sounds/v1/ui/button_click.ogg'
const SUCCESS_SOUND = 'https://actions.google.com/sounds/v1/ui/pop.ogg'
const SWOOSH_SOUND = 'https://actions.google.com/sounds/v1/water/splash_light.ogg'

export function useAppSounds() {
  const [playPop] = useSound(POP_SOUND, { volume: 0.3 })
  const [playSuccess] = useSound(SUCCESS_SOUND, { volume: 0.4 })
  const [playSwoosh] = useSound(SWOOSH_SOUND, { volume: 0.3 })
  
  return {
    playPop,
    playSuccess,
    playSwoosh
  }
}
