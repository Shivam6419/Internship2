import React from 'react';
import { COLORS, BRUSH_SIZES } from '../../hooks/useCanvas';
import { Eraser, RotateCcw, Trash2, Paintbrush } from 'lucide-react';

export default function CanvasToolbar({
  isDrawer,
  color,
  setColor,
  size,
  setSize,
  isEraser,
  setIsEraser,
  onUndo,
  onClear
}) {
  if (!isDrawer) {
    return (
      <div className="canvas-toolbar" style={{ justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          👀 You are currently guessing. Watch the drawer draw!
        </span>
      </div>
    );
  }

  return (
    <div className="canvas-toolbar">
      {/* Color Palette */}
      <div className="toolbar-section">
        <div className="color-palette">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-btn ${color === c && !isEraser ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Brush Sizes */}
      <div className="toolbar-section">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.label}
            className={`size-btn ${size === b.size ? 'active' : ''}`}
            onClick={() => setSize(b.size)}
            title={`Size ${b.label}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Tools: Eraser, Undo, Clear */}
      <div className="toolbar-section">
        <button
          className={`tool-action-btn ${isEraser ? 'active' : ''}`}
          onClick={() => setIsEraser(prev => !prev)}
          title="Eraser tool"
        >
          <Eraser size={16} />
          <span>Eraser</span>
        </button>

        <button
          className="tool-action-btn"
          onClick={onUndo}
          title="Undo last stroke"
        >
          <RotateCcw size={16} />
          <span>Undo</span>
        </button>

        <button
          className="tool-action-btn danger"
          onClick={onClear}
          title="Clear entire canvas"
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
