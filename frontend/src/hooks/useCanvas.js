import { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { EVENTS } from '../constants/events';

export const COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#6b7280', // Gray
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f'  // Brown
];

export const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 6 },
  { label: 'L', size: 12 },
  { label: 'XL', size: 20 }
];

export function useCanvas({ isDrawer }) {
  const { socket } = useSocket();
  const canvasRef = useRef(null);

  // Drawing tool settings
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Active stroke buffer
  const isDrawingRef = useRef(false);
  const activeColorRef = useRef(color);
  const activeSizeRef = useRef(size);
  const isEraserRef = useRef(isEraser);

  // Keep refs in sync with state for event callbacks
  useEffect(() => { activeColorRef.current = color; }, [color]);
  useEffect(() => { activeSizeRef.current = size; }, [size]);
  useEffect(() => { isEraserRef.current = isEraser; }, [isEraser]);

  /**
   * Converts mouse / pointer client coordinates to normalized (0.0 to 1.0) values
   */
  const getNormalizedCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  }, []);

  /**
   * Denormalizes (0.0 to 1.0) coordinates to actual canvas pixel coordinates
   */
  const denormalize = useCallback((normX, normY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { px: 0, py: 0 };
    return {
      px: normX * canvas.width,
      py: normY * canvas.height
    };
  }, []);

  /**
   * Redraws an entire stroke history array (used for late joiners and undo)
   */
  const replayStrokeHistory = useCallback((history) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!Array.isArray(history)) return;

    history.forEach(stroke => {
      if (stroke.type === 'stroke' && stroke.points?.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const firstPt = denormalize(stroke.points[0].x, stroke.points[0].y);
        ctx.moveTo(firstPt.px, firstPt.py);

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = denormalize(stroke.points[i].x, stroke.points[i].y);
          ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
        ctx.closePath();
      }
    });
  }, [denormalize]);

  // SOCKET LISTENERS FOR REAL-TIME DRAWING
  useEffect(() => {
    if (!socket) return;

    const onDrawData = (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (data.type === 'start') {
        const { px, py } = denormalize(data.x, data.y);
        ctx.beginPath();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(px, py);
        // Draw initial dot
        ctx.lineTo(px, py);
        ctx.stroke();
      } else if (data.type === 'move') {
        const { px, py } = denormalize(data.x, data.y);
        ctx.lineTo(px, py);
        ctx.stroke();
      } else if (data.type === 'end') {
        ctx.closePath();
      }
    };

    const onCanvasCleared = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onDrawUndone = ({ strokeHistory }) => {
      replayStrokeHistory(strokeHistory);
    };

    socket.on(EVENTS.DRAW_DATA, onDrawData);
    socket.on(EVENTS.CANVAS_CLEARED, onCanvasCleared);
    socket.on(EVENTS.DRAW_UNDONE, onDrawUndone);

    return () => {
      socket.off(EVENTS.DRAW_DATA, onDrawData);
      socket.off(EVENTS.CANVAS_CLEARED, onCanvasCleared);
      socket.off(EVENTS.DRAW_UNDONE, onDrawUndone);
    };
  }, [socket, denormalize, replayStrokeHistory]);

  // LOCAL DRAWING HANDLERS (Used only by drawer)
  const startDrawing = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { x, y } = getNormalizedCoordinates(e);
    const { px, py } = denormalize(x, y);

    const strokeColor = isEraserRef.current ? '#ffffff' : activeColorRef.current;
    const strokeSize = isEraserRef.current ? activeSizeRef.current * 2.5 : activeSizeRef.current;

    isDrawingRef.current = true;
    setIsDrawing(true);

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(px, py);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Emit to server
    socket.emit(EVENTS.DRAW_START, {
      x,
      y,
      color: strokeColor,
      size: strokeSize
    });
  }, [isDrawer, getNormalizedCoordinates, denormalize, socket]);

  const drawMove = useCallback((e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { x, y } = getNormalizedCoordinates(e);
    const { px, py } = denormalize(x, y);

    ctx.lineTo(px, py);
    ctx.stroke();

    // Emit to server
    socket.emit(EVENTS.DRAW_MOVE, { x, y });
  }, [isDrawer, getNormalizedCoordinates, denormalize, socket]);

  const endDrawing = useCallback(() => {
    if (!isDrawer || !isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }

    socket.emit(EVENTS.DRAW_END);
  }, [isDrawer, socket]);

  // Clear canvas action
  const clearCanvas = useCallback(() => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    socket.emit(EVENTS.CANVAS_CLEAR);
  }, [isDrawer, socket]);

  // Undo action
  const undoLastStroke = useCallback(() => {
    if (!isDrawer) return;
    socket.emit(EVENTS.DRAW_UNDO);
  }, [isDrawer, socket]);

  return {
    canvasRef,
    color,
    setColor,
    size,
    setSize,
    isEraser,
    setIsEraser,
    isDrawing,
    startDrawing,
    drawMove,
    endDrawing,
    clearCanvas,
    undoLastStroke
  };
}
