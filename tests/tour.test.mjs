import { test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTour } from '../js/tour.js';

const steps = [
  { title: 'A', position: '0 0.47 0.02', orbit: '20deg 55deg 2.6m' },
  { title: 'B', position: '-1 0.6 -0.1' },
  { title: 'C', position: '1 0 0.3', orbit: '40deg 85deg 1.8m' },
];
let viewer, calls;
const fakeViewer = () => ({ cameraTarget: '', cameraOrbit: '', availableAnimations: [], animationName: '', played: null, play(o) { this.played = o; } });
beforeEach(() => { mock.timers.enable({ apis: ['setInterval', 'setTimeout'] }); viewer = fakeViewer(); calls = []; });
afterEach(() => mock.timers.reset());

const tour = () => createTour(viewer, steps, i => calls.push(i));

test('start goes to step 0 and points the camera at it', () => {
  tour().start();
  assert.deepEqual(calls, [0]);
  assert.equal(viewer.cameraTarget, '0m 0.47m 0.02m');
  assert.equal(viewer.cameraOrbit, '20deg 55deg 2.6m');
});
test('a step without orbit uses auto', () => {
  const t = tour(); t.start(); t.next();
  assert.equal(viewer.cameraOrbit, 'auto auto auto');
});
test('auto-advances every 4s and next() advances', () => {
  const t = tour(); t.start();
  mock.timers.tick(4000);
  assert.deepEqual(calls, [0, 1]);
  t.next();
  assert.deepEqual(calls, [0, 1, 2]);
});
test('next past the last step ends the tour and resets the camera', () => {
  const t = tour(); t.start(); t.next(); t.next(); t.next();
  assert.deepEqual(calls, [0, 1, 2, null]);
  assert.equal(viewer.cameraTarget, 'auto auto auto');
  assert.equal(viewer.cameraOrbit, '0deg 75deg auto');
  mock.timers.tick(20000);
  assert.deepEqual(calls, [0, 1, 2, null]);
});
test('stop mid-tour resets and stops the timer', () => {
  const t = tour(); t.start(); t.stop();
  assert.deepEqual(calls, [0, null]);
  assert.equal(viewer.cameraTarget, 'auto auto auto');
  mock.timers.tick(10000);
  assert.deepEqual(calls, [0, null]);
});
test('plays the model animation once when it has one', () => {
  viewer.availableAnimations = ['Open'];
  tour().start();
  assert.equal(viewer.animationName, 'Open');
  assert.deepEqual(viewer.played, { repetitions: 1 });
});
