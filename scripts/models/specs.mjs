export const SOURCE_DIR = "D:/Project/PCBModel";

export const BOARD_SPECS = {
  keel: {
    source: "Keel.glb",
    designators: 41,
    layers: [
      "Keel_PCB",
      "Keel_PCB_Pads",
      "Keel_PCB_Tracks",
      "Keel_PCB_Zones",
      "Keel_PCB_Silkscreen_Top",
      "Keel_PCB_Silkscreen_Bottom",
      "Keel_PCB_Soldermask_Top",
      "Keel_PCB_Soldermask_Bottom",
    ],
    extras: ["Duct"],
  },
  interim: {
    source: "Interim.glb",
    designators: 54,
    layers: [
      "Interim_PCB",
      "Interim_Pads",
      "Interim_Silk_Front",
      "Interim_Silk_Back",
      "Interim_Mask_Front",
      "Interim_Mask_Back",
    ],
    extras: [],
  },
  fides: {
    source: "Fides.glb",
    designators: 16,
    layers: [
      "Fides_PCB_body",
      "Fides_pads",
      "Fides_copper_zones",
      "Fides_copper_tracks",
      "Fides_silkscreen_top",
      "Fides_silkscreen_bottom",
      "Fides_soldermask_top",
      "Fides_soldermask_bottom",
    ],
    extras: [],
  },
};
