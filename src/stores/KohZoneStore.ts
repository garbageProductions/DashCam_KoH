import { KohZone } from "@/interfaces/KohZone";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import seedData from "@/data/KohZones.json";

const STORAGE_KEY = "kohZones";
const ACTIVE_KEY = "kohActiveZoneId";

export const useKohZoneStore = defineStore("kohZones", () => {
	const zones = ref<KohZone[]>([]);
	const activeZoneId = ref<string | null>(localStorage.getItem(ACTIVE_KEY));

	function load() {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			try {
				zones.value = JSON.parse(raw) as KohZone[];
			} catch {
				zones.value = [...(seedData.zones as KohZone[])];
			}
		} else {
			zones.value = [...(seedData.zones as KohZone[])];
		}
	}

	function save() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(zones.value));
	}

	function addZone(zone: Omit<KohZone, "id">) {
		zones.value.push({ ...zone, id: Date.now().toString() });
		save();
	}

	function updateZone(id: string, updates: Partial<Omit<KohZone, "id">>) {
		const index = zones.value.findIndex((z) => z.id === id);
		if (index !== -1) {
			zones.value[index] = { ...zones.value[index], ...updates };
			save();
		}
	}

	function deleteZone(id: string) {
		zones.value = zones.value.filter((z) => z.id !== id);
		if (activeZoneId.value === id) setActiveZone(null);
		save();
	}

	function setActiveZone(id: string | null) {
		activeZoneId.value = id;
		if (id) {
			localStorage.setItem(ACTIVE_KEY, id);
		} else {
			localStorage.removeItem(ACTIVE_KEY);
		}
	}

	const activeZone = computed(() =>
		zones.value.find((z) => z.id === activeZoneId.value) ?? null
	);

	function exportJson(): string {
		return JSON.stringify({ zones: zones.value }, null, 2);
	}

	function isPlayerOnHill(
		position: { X: number; Y: number; Z: number },
		zone: KohZone
	): boolean {
		const halfW = zone.width / 2;
		const halfD = zone.depth / 2;
		const heightUnits = zone.robotHeight * 2;
		return (
			position.X >= zone.centerX - halfW &&
			position.X <= zone.centerX + halfW &&
			position.Z >= zone.centerZ - halfD &&
			position.Z <= zone.centerZ + halfD &&
			position.Y >= zone.centerY &&
			position.Y <= zone.centerY + heightUnits
		);
	}

	function getZonesByMap(mapName: string): KohZone[] {
		return zones.value.filter((z) => z.mapName === mapName);
	}

	function uniqueMapNames(): string[] {
		return [...new Set(zones.value.map((z) => z.mapName))];
	}

	load();

	return {
		zones,
		activeZoneId,
		activeZone,
		setActiveZone,
		addZone,
		updateZone,
		deleteZone,
		exportJson,
		isPlayerOnHill,
		getZonesByMap,
		uniqueMapNames,
	};
});
