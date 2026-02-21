import {makeProject} from '@motion-canvas/core';

import title from './scenes/title?scene';
import layers from './scenes/layers?scene';
import coherence from './scenes/coherence?scene';
import credits from './scenes/credits?scene';

export default makeProject({
  scenes: [title, layers, coherence, credits],
});
