// src/modules/volume/utils/volume-mapping.util.ts

export type VolumeItem = {
  key: string;
  label: string;
  cft: number;
};

export type RoomVolumeMap = {
  room: string;
  items: VolumeItem[];
};

export const ROOM_VOLUME_MAP: RoomVolumeMap[] = [
  {
    room: "LIVING_ROOM",
    items: [
      { key: "SOFA_3", label: "3-Seater Sofa", cft: 70 },
      { key: "SOFA_2", label: "2-Seater Sofa", cft: 50 },
      { key: "ARM_CHAIR", label: "Arm Chair", cft: 25 },
      { key: "COFFEE_TABLE", label: "Coffee Table", cft: 15 },
      { key: "TV_STAND", label: "TV Stand", cft: 20 },
      { key: "BOOKSHELF", label: "Bookshelf", cft: 30 },
      { key: "LAMP", label: "Lamp", cft: 5 },
    ],
  },

  {
    room: "DINING_ROOM",
    items: [
      { key: "DINING_TABLE", label: "Dining Table", cft: 40 },
      { key: "DINING_CHAIR", label: "Dining Chair", cft: 12 },
      { key: "BUFFET", label: "Buffet / Sideboard", cft: 45 },
    ],
  },

  {
    room: "KITCHEN",
    items: [
      { key: "FRIDGE", label: "Refrigerator", cft: 45 },
      { key: "STOVE", label: "Stove", cft: 35 },
      { key: "DISHWASHER", label: "Dishwasher", cft: 30 },
      { key: "MICROWAVE", label: "Microwave", cft: 10 },
      { key: "KITCHEN_BOX", label: "Kitchen Box", cft: 5 },
    ],
  },

  {
    room: "BEDROOM",
    items: [
      { key: "KING_BED", label: "King Bed", cft: 70 },
      { key: "QUEEN_BED", label: "Queen Bed", cft: 65 },
      { key: "DOUBLE_BED", label: "Double Bed", cft: 55 },
      { key: "WARDROBE", label: "Wardrobe", cft: 60 },
      { key: "DRESSER", label: "Dresser", cft: 35 },
      { key: "NIGHT_TABLE", label: "Night Table", cft: 10 },
    ],
  },

  {
    room: "BATHROOM",
    items: [
      { key: "BATHROOM_BOX", label: "Bathroom Box", cft: 5 },
    ],
  },

  {
    room: "OFFICE",
    items: [
      { key: "DESK", label: "Office Desk", cft: 35 },
      { key: "OFFICE_CHAIR", label: "Office Chair", cft: 15 },
      { key: "FILE_CABINET", label: "File Cabinet", cft: 25 },
      { key: "PRINTER", label: "Printer", cft: 10 },
    ],
  },

  {
    room: "BASEMENT",
    items: [
      { key: "BOX", label: "Storage Box", cft: 5 },
      { key: "FREEZER", label: "Freezer", cft: 45 },
      { key: "GYM_EQUIPMENT", label: "Gym Equipment", cft: 60 },
    ],
  },

  {
    room: "GARAGE",
    items: [
      { key: "TOOL_BOX", label: "Tool Box", cft: 20 },
      { key: "BIKE", label: "Bicycle", cft: 30 },
      { key: "LAWN_MOWER", label: "Lawn Mower", cft: 40 },
    ],
  },

  {
    room: "OUTDOOR",
    items: [
      { key: "BBQ", label: "BBQ", cft: 35 },
      { key: "PATIO_SET", label: "Patio Set", cft: 50 },
    ],
  },

  {
    room: "OTHER",
    items: [
      { key: "CUSTOM_ITEM", label: "Custom Item", cft: 0 },
    ],
  },
];
