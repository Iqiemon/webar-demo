// Guided demonstration: moves the camera through the product's hotspots, one step every `intervalMs`.
// Plays the model's first built-in animation (e.g. parts opening) when it has one.
const HOME_ORBIT = '0deg 75deg auto';
const toTarget = pos => pos.trim().split(/\s+/).map(n => `${n}m`).join(' ');

export function createTour(viewer, steps, onStep, { intervalMs = 4000 } = {}) {
  let index = -1, timer = null;

  const go = i => {
    index = i;
    viewer.cameraTarget = toTarget(steps[i].position);
    viewer.cameraOrbit = steps[i].orbit ?? 'auto auto auto';
    onStep(i);
  };
  const restartTimer = () => { clearInterval(timer); timer = setInterval(next, intervalMs); };

  function start() {
    if (viewer.availableAnimations?.length) {
      viewer.animationName = viewer.availableAnimations[0];
      viewer.play({ repetitions: 1 });
    }
    go(0);
    restartTimer();
  }
  function next() {
    if (index < 0) return;
    if (index + 1 >= steps.length) return stop();
    go(index + 1);
    restartTimer();
  }
  // Holds the current step (e.g. while the user rotates the model); next() resumes auto-advance.
  function pause() {
    clearInterval(timer);
    timer = null;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    index = -1;
    viewer.cameraTarget = 'auto auto auto';
    viewer.cameraOrbit = HOME_ORBIT;
    onStep(null);
  }
  return { start, next, pause, stop };
}
