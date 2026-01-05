/**
 * BallCanvas - React wrapper for PixiJS ball simulation
 *
 * This component is fully self-contained - it manages its own state internally.
 * External control is done via the ref handle methods only.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
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
  theme?: Theme;
  className?: string;
}

export const BallCanvas = forwardRef<BallCanvasHandle, BallCanvasProps>(
  function BallCanvas({ theme = "dark", className = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<BallRenderer | null>(null);

    // Initialize renderer once on mount - empty dependency array
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Don't re-initialize if already exists
      if (rendererRef.current) return;

      const renderer = new BallRenderer();
      const rect = container.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 400;

      let mounted = true;

      renderer
        .init(container, width, height)
        .then(() => {
          if (mounted) {
            rendererRef.current = renderer;
          } else {
            renderer.destroy();
          }
        })
        .catch((err) => {
          console.error("Failed to initialize ball renderer:", err);
        });

      // Set up resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0 && rendererRef.current) {
            rendererRef.current.resize(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      return () => {
        mounted = false;
        resizeObserver.disconnect();
        if (rendererRef.current) {
          rendererRef.current.destroy();
          rendererRef.current = null;
        }
      };
    }, []); // Empty deps - only run on mount/unmount

    // Update theme when it changes (separate effect, doesn't cause reinit)
    useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setTheme(theme);
      }
    }, [theme]);

    // Expose controls via ref
    useImperativeHandle(
      ref,
      () => ({
        addBall: (ball: Ball) => rendererRef.current?.addBall(ball),
        removeBall: (ballId: string) => rendererRef.current?.removeBall(ballId),
        clearBalls: () => rendererRef.current?.clearBalls(),
        setGravity: (gravity: number) =>
          rendererRef.current?.setGravity(gravity),
        setFriction: (friction: number) =>
          rendererRef.current?.setFriction(friction),
        setPaused: (paused: boolean) => rendererRef.current?.setPaused(paused),
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
      []
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
