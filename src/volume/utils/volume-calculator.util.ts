import { InventoryItemDto } from "../dto/create-volume.dto";

/* -------------------------------------------
   TOTAL VOLUME (CFT)
-------------------------------------------- */
export function calculateTotalVolume(
  inventory: InventoryItemDto[],
): number {
  return inventory.reduce((total, item) => {
    return total + item.volumeCft * item.quantity;
  }, 0);
}

/* -------------------------------------------
   TOTAL WEIGHT (LBS)
-------------------------------------------- */
export function calculateEstimatedWeight(
  inventory: InventoryItemDto[],
): number {
  return inventory.reduce((total, item) => {
    if (!item.weightLbs) return total;
    return total + item.weightLbs * item.quantity;
  }, 0);
}

/* -------------------------------------------
   TRUCK SUGGESTION
-------------------------------------------- */
export function getSuggestedTruck(volume: number): string {
  if (volume <= 200) return "10 FT Truck";
  if (volume <= 400) return "16 FT Truck";
  if (volume <= 650) return "20 FT Truck";
  if (volume <= 1000) return "26 FT Truck";
  return "26 FT Truck x 2";
}

/* -------------------------------------------
   WORKERS SUGGESTION
-------------------------------------------- */
export function getSuggestedWorkers(volume: number): number {
  if (volume <= 300) return 2;
  if (volume <= 600) return 3;
  if (volume <= 900) return 4;
  return 5;
}
