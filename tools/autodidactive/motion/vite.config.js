import mc from '@motion-canvas/vite-plugin';
import {defineConfig} from 'vite';

const motionCanvas = mc.default || mc;

export default defineConfig({
  plugins: [
    motionCanvas({
      project: ['./src/project.ts'],
    }),
  ],
});
