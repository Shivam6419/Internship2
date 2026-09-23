import React, { useEffect, useRef } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import CanvasToolbar from './CanvasToolbar';
import './Canvas.css';

export default function Canvas({ isDrawer, drawerName }) {
  const containerRef = useRef(null);

  const {
    canvasRef,
    color,
    setColor,
    size,
    setSize,
    isEraser,
    setIsEraser,
    startDrawing,
    drawMove,
    endDrawing,
    clearCanvas,
    undoLastStroke
  } = useCanvas({ isDrawer });

  // Handle high-DPI and responsive sizing without distortion
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Save existing drawing image data before resize
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Update canvas internal pixel dimensions
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Restore image data
        try {
          ctx.putImageData(imgData, 0, 0);
        } catch {
          // In case dimensions changed significantly
        }
      }
    };

    resizeCanvas();

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasRef]);

  return (
    <div className="canvas-container">
      {/* Spectator notice if user is not drawer */}
      {!isDrawer && (
        <div className="spectator-banner">
          ✏️ {drawerName ? `${drawerName} is drawing...` : 'Waiting for drawing...'}
        </div>
      )}

      {/* Interactive Drawing Viewport */}
      <div
        ref={containerRef}
        className={`canvas-viewport-wrapper ${!isDrawer ? 'not-drawer' : ''}`}
        onPointerDown={isDrawer ? startDrawing : undefined}
        onPointerMove={isDrawer ? drawMove : undefined}
        onPointerUp={isDrawer ? endDrawing : undefined}
        onPointerLeave={isDrawer ? endDrawing : undefined}
      >
        <canvas ref={canvasRef} className="canvas-element" />
      </div>

      {/* Drawing Toolbar */}
      <CanvasToolbar
        isDrawer={isDrawer}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        onUndo={undoLastStroke}
        onClear={clearCanvas}
      />
    </div>
  );
}
