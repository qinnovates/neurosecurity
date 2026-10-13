import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { rasToScene } from '@/lib/anatomy/ras-to-scene';
import { ORBIT_STEP_RADIANS, zoomDistance, type CameraViewId } from '@/lib/atlas-explorer/camera-views';
import type { SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import type { SliceState } from '@/lib/atlas-explorer/slice-plane';
import { createSceneRenderer, type SceneCallbacks, type SceneRenderer } from './scene-renderer';

/** What the view's buttons can ask of the camera. They are the keyboard's way to everything a drag does. */
export interface CanvasCommands {
  setView: (viewId: CameraViewId) => void;
  zoom: (direction: 'in' | 'out') => void;
  turn: (direction: 'left' | 'right') => void;
}

export interface AtlasCanvasProps extends SceneCallbacks {
  shapes: readonly SceneShape[];
  nodesByShapeId: ReadonlyMap<string, DecodedNode>;
  selectedKeys: ReadonlySet<string>;
  /** Where the selection is, in the atlas's millimetres, or null. The camera settles on it when it changes. */
  focusMm: readonly [number, number, number] | null;
  slice: SliceState | null;
  prefersLessMotion: boolean;
  /** Says in words what the picture shows, for anyone who cannot see it. */
  description: string;
  /** Called when the browser gives no WebGL context after all. */
  onUnavailable: () => void;
  commands: Ref<CanvasCommands>;
}

/**
 * The canvas, and the only component that reaches three.js. It is a picture:
 * not a tab stop, with its description beside it. Everything it can do is also
 * a button outside it, so nothing here needs a pointer.
 */
export default function AtlasCanvas(props: AtlasCanvasProps) {
  const { shapes, nodesByShapeId, selectedKeys, focusMm, slice, prefersLessMotion, description, commands } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const callbacksRef = useRef(props);
  callbacksRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    let renderer: SceneRenderer;
    try {
      renderer = createSceneRenderer(canvas, {
        onPick: (key) => callbacksRef.current.onPick(key),
        onHover: (key) => callbacksRef.current.onHover(key),
        onCameraTurn: (directions) => callbacksRef.current.onCameraTurn(directions),
        onContextLost: () => callbacksRef.current.onContextLost(),
      }, prefersLessMotion);
    } catch {
      // The probe said WebGL was there and the renderer still could not start: say so in the page, in place of the picture.
      callbacksRef.current.onUnavailable();
      return undefined;
    }
    rendererRef.current = renderer;
    const observer = new ResizeObserver(([entry]) => renderer.resize(entry.contentRect.width, entry.contentRect.height));
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [prefersLessMotion]);

  useEffect(() => rendererRef.current?.setShapes(shapes, nodesByShapeId, selectedKeys), [shapes, nodesByShapeId, selectedKeys]);
  useEffect(() => rendererRef.current?.setSlice(slice), [slice]);
  useEffect(() => { if (focusMm !== null) rendererRef.current?.focusOn(rasToScene(focusMm)); }, [focusMm]);

  useImperativeHandle(commands, () => ({
    setView: (viewId) => rendererRef.current?.setView(viewId),
    zoom: (direction) => { const renderer = rendererRef.current; if (renderer !== null) renderer.zoomTo(zoomDistance(renderer.distance(), direction)); },
    turn: (direction) => rendererRef.current?.turnBy(direction === 'left' ? -ORBIT_STEP_RADIANS : ORBIT_STEP_RADIANS),
  }), []);

  return <canvas ref={canvasRef} className="atlas-canvas" role="img" aria-label={description} />;
}
