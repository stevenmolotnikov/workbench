import { lineMargin as margin } from "../theming";

const clear = (selectionCanvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = selectionCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
};

const clearCrosshair = (crosshairCanvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = crosshairCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
};

const drawRectPx = (
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>,
    x0: number,
    y0: number,
    x1: number,
    y1: number
) => {
    const canvas = selectionCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // clamp to inner plotting area defined by margins
    const innerMinX = margin.left;
    const innerMaxX = canvas.clientWidth - margin.right;
    const innerMinY = margin.top;
    const innerMaxY = canvas.clientHeight - margin.bottom;
    const minX = Math.max(innerMinX, Math.min(x0, x1));
    const maxX = Math.min(innerMaxX, Math.max(x0, x1));
    const minY = Math.max(innerMinY, Math.min(y0, y1));
    const maxY = Math.min(innerMaxY, Math.max(y0, y1));
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "rgba(239,68,68,0.25)"; // red-500 at 25%
    ctx.strokeStyle = "#ef4444"; // red-500
    ctx.lineWidth = 1;
    ctx.fillRect(minX, minY, Math.max(0, maxX - minX), Math.max(0, maxY - minY));
    ctx.strokeRect(
        minX + 0.5,
        minY + 0.5,
        Math.max(0, maxX - minX - 1),
        Math.max(0, maxY - minY - 1)
    );
};

const drawVerticalLinePx = (
    crosshairCanvasRef: React.RefObject<HTMLCanvasElement>,
    xPx: number
) => {
    const canvas = crosshairCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.save();
    ctx.strokeStyle = "#9ca3af"; // gray-400
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    const y0 = margin.top;
    const y1 = canvas.clientHeight - margin.bottom;
    ctx.beginPath();
    ctx.moveTo(xPx + 0.5, y0);
    ctx.lineTo(xPx + 0.5, y1);
    ctx.stroke();
    ctx.restore();
};

export { clear, clearCrosshair, drawRectPx, drawVerticalLinePx };