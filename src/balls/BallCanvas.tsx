/**
 * BallCanvas - React wrapper for PixiJS ball simulation
 */

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from "react";
import { BallRenderer } from "./BallRenderer";
import type { Ball, BallState, Theme } from "./types";

export interface BallCanvasHandle {
  addBall: (ball: Ball) => void;
  removeBall: (ballId: string) => void;
  clearBalls: () => void;
  setGravity: (gravity: number) => void;
  setFriction: (friction: number) => void;
  setPaused: (paused: boolean) => void;
  setTheme: (theme: Theme) => void;
  getState: () => BallState;
}

interface BallCanvasProps {
  initialState?: BallState;
  onStateChange?: (state: BallState) => void;
  onBallClick?: (ballId: string) => void;
  onBallAdd?: (ball: Ball) => void;
  theme?: Theme;
  className?: string;
}

export const BallCanvas = forwardRef<BallCanvasHandle, BallCanvasProps>(
  function BallCanvas(
    {
      initialState,
      onStateChange,
      onBallClick,
      onBallAdd,
      theme = "dark",
      className = ""
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<BallRenderer | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize renderer
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let mounted = true;

      const renderer = new BallRenderer({
        onBallClick,
        onBallAdd
      });
      rendererRef.current = renderer;

      const rect = container.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 400;

      renderer
        .init(container, width, height)
        .then(() => {
          if (!mounted) return;
          if (initialState) {
            renderer.setState(initialState);
          }
          renderer.setTheme(theme);
          setIsInitialized(true);
        })
        .catch((err) => {
          console.error("Failed to initialize ball renderer:", err);
        });

      // Set up resize observer
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) {
            renderer.resize(w, h);
          }
        }
      });
      resizeObserverRef.current.observe(container);

      return () => {
        mounted = false;
        resizeObserverRef.current?.disconnect();
        renderer.destroy();
        rendererRef.current = null;
        setIsInitialized(false);
      };
    }, []);

    // Update theme when it changes
    useEffect(() => {
      if (isInitialized && rendererRef.current) {
        rendererRef.current.setTheme(theme);
      }
    }, [isInitialized, theme]);

    // Update state when initialState changes
    useEffect(() => {
      if (isInitialized && rendererRef.current && initialState) {
        rendererRef.current.setState(initialState);
      }
    }, [isInitialized, initialState]);

    // Expose controls via ref
    useImperativeHandle(
      ref,
      () => ({
        addBall: (ball: Ball) => {
          rendererRef.current?.addBall(ball);
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        removeBall: (ballId: string) => {
          rendererRef.current?.removeBall(ballId);
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        clearBalls: () => {
          rendererRef.current?.clearBalls();
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        setGravity: (gravity: number) => {
          rendererRef.current?.setGravity(gravity);
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        setFriction: (friction: number) => {
          rendererRef.current?.setFriction(friction);
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        setPaused: (paused: boolean) => {
          rendererRef.current?.setPaused(paused);
          onStateChange?.(rendererRef.current?.getState() || { balls: [], gravity: 0.02, gravityAngle: Math.PI / 2, friction: 0.998, paused: false });
        },
        setTheme: (t: Theme) => rendererRef.current?.setTheme(t),
        getState: () =>
          rendererRef.current?.getState() || {
            balls: [],
            gravity: 0.02,
            gravityAngle: Math.PI / 2,
            friction: 0.998,
            paused: false
          }
      }),
      [onStateChange]
    );

    return (
      <div
        ref={containerRef}
        className={`w-full h-full min-h-[300px] ${className}`}
        style={{ touchAction: "none" }}
      />
    );
  }
);
