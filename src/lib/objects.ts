const DIAMETER_COLORS: { [key: number]: string } = { 100: '#93c5fd', 125: '#6ee7b7', 150: '#fde047' };
const DEFAULT_COLOR = '#60a5fa';
function getColorForDiameter(diameter: number): string { return DIAMETER_COLORS[diameter] || DEFAULT_COLOR; }

export class DuctPart {
  id: number; x: number; y: number; rotation: number; diameter: number;
  type: string = 'DuctPart'; isSelected: boolean = false;
  constructor(id: number, x: number, y: number, options: Partial<DuctPart> = {}) {
    this.id = id; this.x = x; this.y = y; this.rotation = options.rotation || 0;
    this.diameter = options.diameter || 100; this.isSelected = options.isSelected || false;
  }
  get color(): string { return getColorForDiameter(this.diameter); }
  
  // 未使用の引数の前にアンダースコア(_)を付けて警告を抑制
  draw(_ctx: CanvasRenderingContext2D, _camera: { zoom: number }) {}
  isPointInside(_px: number, _py: number): boolean { return false; }
  
  rotate() { this.rotation = (this.rotation + 45) % 360; }
  clone(): DuctPart { return new DuctPart(this.id, this.x, this.y, this); }
}

export class StraightDuct extends DuctPart {
  length: number; systemName: string;
  constructor(id: number, x: number, y: number, options: Partial<StraightDuct> = {}) {
    super(id, x, y, options); this.type = 'StraightDuct';
    this.length = options.length === undefined ? 400 : options.length;
    this.systemName = options.systemName || 'SA-1';
  }
  draw(ctx: CanvasRenderingContext2D, camera: { zoom: number }) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation * Math.PI / 180);
    const width = this.length; const height = this.diameter;
    ctx.fillStyle = this.color; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2 / camera.zoom;
    ctx.fillRect(-width / 2, -height / 2, width, height); ctx.strokeRect(-width / 2, -height / 2, width, height);
    if (this.isSelected) {
        ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 4 / camera.zoom;
        ctx.strokeRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10);
    }
    ctx.beginPath(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 1 / camera.zoom;
    ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
    ctx.moveTo(-this.length / 2, 0); ctx.lineTo(this.length / 2, 0); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  isPointInside(px: number, py: number): boolean {
    const dx = px - this.x; const dy = py - this.y; const rad = -this.rotation * Math.PI / 180;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad); const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
    return (Math.abs(localX) <= this.length / 2 && Math.abs(localY) <= this.diameter / 2);
  }
  clone(): StraightDuct { return new StraightDuct(this.id, this.x, this.y, this); }
}

export class Elbow90 extends DuctPart {
    legLength: number;
    constructor(id: number, x: number, y: number, options: Partial<Elbow90> = {}) {
        super(id, x, y, options); this.type = 'Elbow90';
        this.legLength = options.legLength || 150;
    }
    draw(ctx: CanvasRenderingContext2D, _camera: { zoom: number }) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation * Math.PI / 180);
        ctx.strokeStyle = this.color; ctx.lineWidth = this.diameter; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(0, this.legLength); ctx.lineTo(0, 0); ctx.lineTo(this.legLength, 0); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#1e293b'; ctx.stroke();
        if (this.isSelected) {
            ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = this.diameter + 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(0, this.legLength); ctx.lineTo(0, 0); ctx.lineTo(this.legLength, 0); ctx.stroke();
        }
        ctx.restore();
    }
    isPointInside(px: number, py: number): boolean {
        const dx = px - this.x; const dy = py - this.y; const rad = -this.rotation * Math.PI / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad); const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
        const leg1 = (localX >= -this.diameter/2 && localX <= this.diameter/2 && localY >= 0 && localY <= this.legLength);
        const leg2 = (localY >= -this.diameter/2 && localY <= this.diameter/2 && localX >= 0 && localX <= this.legLength);
        return leg1 || leg2;
    }
    clone(): Elbow90 { return new Elbow90(this.id, this.x, this.y, this); }
}