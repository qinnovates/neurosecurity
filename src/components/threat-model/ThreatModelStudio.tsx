import type { ModeProps } from '@/components/workbench/mode-registry';
import ModelFrame from './frame/ModelFrame';
import { ModelHighlightProvider } from './model-highlight';
import './threat-model.css';
import './model-layout.css';

/**
 * The Model mode: describe the device in focus, then read what applies to it. One lit part
 * or connection is shared by every view inside, so pointing at it anywhere lights it everywhere.
 */
export default function ThreatModelStudio(props: ModeProps) {
  return (
    <ModelHighlightProvider>
      <ModelFrame {...props} />
    </ModelHighlightProvider>
  );
}
