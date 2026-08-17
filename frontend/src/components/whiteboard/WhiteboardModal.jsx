import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import {
  PenTool,
  Brush,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Type,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Palette,
} from 'lucide-react';

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ffffff', // White
  '#ef4444', // Red
];

export const WhiteboardModal = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const { socket, addToast } = useSocket();
  const { user } = useAuth();

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [activeTool, setActiveTool] = useState('pencil'); // 'pencil' | 'eraser' | 'rect' | 'circle'
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth || 800;
    canvas.height = 480;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  // Socket listener for strokes from other users
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleCanvasDraw = ({ strokeData }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const { type, prevX, prevY, currX, currY, color, size } = strokeData;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (type === 'pencil' || type === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      } else if (type === 'rect') {
        ctx.strokeRect(prevX, prevY, currX - prevX, currY - prevY);
      } else if (type === 'circle') {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(currX - prevX, 2) + Math.pow(currY - prevY, 2));
        ctx.arc(prevX, prevY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };

    const handleCanvasClear = ({ clearedBy }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      addToast({ type: 'info', message: `${clearedBy} cleared the whiteboard` });
    };

    socket.on('canvasDrawUpdate', handleCanvasDraw);
    socket.on('canvasClearUpdate', handleCanvasClear);

    return () => {
      socket.off('canvasDrawUpdate', handleCanvasDraw);
      socket.off('canvasClearUpdate', handleCanvasClear);
    };
  }, [socket, isOpen, addToast]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    const pos = getCanvasCoordinates(e);
    isDrawingRef.current = true;
    setStartPos(pos);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currPos = getCanvasCoordinates(e);

    const colorToUse = activeTool === 'eraser' ? '#090d16' : selectedColor;
    const sizeToUse = activeTool === 'eraser' ? brushSize * 4 : brushSize;

    ctx.strokeStyle = colorToUse;
    ctx.lineWidth = sizeToUse;

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currPos.x, currPos.y);
      ctx.stroke();

      // Broadcast to room
      socket?.emit('canvasDraw', {
        roomId,
        strokeData: {
          type: activeTool,
          prevX: startPos.x,
          prevY: startPos.y,
          currX: currPos.x,
          currY: currPos.y,
          color: colorToUse,
          size: sizeToUse,
        },
      });

      setStartPos(currPos);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === 'rect' || activeTool === 'circle') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const currPos = getCanvasCoordinates(e);

      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;

      if (activeTool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, currPos.x - startPos.x, currPos.y - startPos.y);
      } else if (activeTool === 'circle') {
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow(currPos.x - startPos.x, 2) + Math.pow(currPos.y - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      socket?.emit('canvasDraw', {
        roomId,
        strokeData: {
          type: activeTool,
          prevX: startPos.x,
          prevY: startPos.y,
          currX: currPos.x,
          currY: currPos.y,
          color: selectedColor,
          size: brushSize,
        },
      });
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    socket?.emit('canvasClear', { roomId });
    addToast({ type: 'info', message: 'Whiteboard cleared' });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomName || 'draw'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast({ type: 'info', message: 'Whiteboard PNG downloaded!' });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎨 Real-Time Collaborative Whiteboard"
      subtitle={`Live synchronized visual canvas for #${roomName || 'Channel'}`}
      maxWidth="4xl"
    >
      <div className="space-y-3">
        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            {[
              { id: 'pencil', icon: PenTool, label: 'Pen' },
              { id: 'rect', icon: Square, label: 'Rectangle' },
              { id: 'circle', icon: Circle, label: 'Circle' },
              { id: 'eraser', icon: Eraser, label: 'Eraser' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`p-2 rounded-xl transition-all ${
                    activeTool === tool.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  if (activeTool === 'eraser') setActiveTool('pencil');
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  selectedColor === c && activeTool !== 'eraser'
                    ? 'scale-125 border-white shadow-md'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={`Color: ${c}`}
              />
            ))}
          </div>

          {/* Stroke Width Slider & Clear/Export */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold">Size:</span>
              <input
                type="range"
                min="1"
                max="16"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-20 accent-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleClear}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Export as PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Drawing Area */}
        <div className="relative w-full rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl bg-[#090d16]">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-[480px] cursor-crosshair touch-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Whiteboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};
