export class DuctPart {
    id: number;
    x: number;
    y: number;
    rotation: number;
    diameter: number;
    type: string;

    constructor(x: number, y: number, options: Record<string, unknown> = {}) {
        this.id = -1; // Will be assigned by the state store
        this.x = x;
        this.y = y;
        this.rotation = (options.rotation as number) || 0;
        this.diameter = (options.diameter as number) || 100;
        this.type = 'DuctPart';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isPointInside(_px: number, _py: number): boolean {
        return false; // Base implementation
    }
}

export class StraightDuct extends DuctPart {
    length: number;
    constructor(x: number, y: number, options: Record<string, unknown> = {}) {
        super(x, y, options);
        this.type = 'StraightDuct';
        this.length = (options.length as number) ?? 400;
    }

    isPointInside(px: number, py: number): boolean {
        const dx = px - this.x;
        const dy = py - this.y;
        const rad = -this.rotation * Math.PI / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
        return Math.abs(localX) <= this.length / 2 && Math.abs(localY) <= this.diameter / 2;
    }
}
