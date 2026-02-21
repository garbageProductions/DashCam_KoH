export interface KohZone {
	id: string;
	name: string;
	mapName: string;
	centerX: number;
	centerY: number;
	centerZ: number;
	width: number;
	depth: number;
	robotHeight: number; // 1–5, each = 2 game units
	imageDataUrl: string; // base64 data URL or empty string
}
