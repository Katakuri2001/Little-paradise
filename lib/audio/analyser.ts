export function createAnalyser(audioEl: HTMLAudioElement) {
  const AudioContext =
    window.AudioContext ||
    ((window as unknown) as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioContext) {
    throw new Error("Web Audio API not supported in this browser");
  }
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const source = ctx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(ctx.destination);
  return {
    analyser,
    source,
    destroy: () => {
      source.disconnect();
      analyser.disconnect();
      ctx.close();
    },
  };
}

export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}
