import type { Board } from "./types";

export const boards: readonly Board[] = [
  {
    slug: "keel",
    designation: "deltaT26",
    codename: "Keel",
    stage: "design-complete",
    fabricated: false,
    mainIc: "INA226",
    dimensions: "85 × 56 mm, 4 layer",
    summary:
      "Mid-stack HAT for a Raspberry Pi 4 NAS: one USB-C supply feeds the Pi and both disks, an on-board USB3 hub replaces the external one, and an INA226 reports system power in real time.",
    highlights: [
      "Single 5.1 V / 5 A USB-C input powers Pi and two disks",
      "On-board Genesys GL3510 USB 3.0 hub",
      "INA226 telemetry shares the I2C bus with the EP-0152 OLED",
      "Ø24 mm centre vent with a 3D-printed duct to the Pi SoC",
    ],
    modelId: "keel",
    repo: { url: "https://github.com/Kleavox/deltaT26-Keel", published: false },
  },
  {
    slug: "deltat32",
    designation: "deltaT32",
    codename: null,
    stage: "archived",
    fabricated: true,
    mainIc: "ESP32-C3",
    dimensions: "modular, main board + two sensor daughter boards",
    summary:
      "Modular ESP32-C3 Mini-1 platform with detachable sensor boards, aimed at wearables but general enough for other embedded work. Archived in June 2026; the esp-rs firmware was planned but never written.",
    highlights: [
      "Hot-swappable BMI160/270 and MPU9250 sensor boards",
      "Designed in KiCad 8, MIT licensed",
      "The only board here that was actually fabricated and assembled",
      "Archived read-only on 13 June 2026",
    ],
    modelId: null,
    repo: { url: "https://github.com/Kleavox/deltaT32", published: true },
  },
  {
    slug: "fides",
    designation: "deltaT35",
    codename: "Fides",
    stage: "design-complete",
    fabricated: false,
    mainIc: "CH32X035",
    dimensions: "15.0 × 16.33 mm, 0.8 mm thick, 2 layer",
    summary:
      "A USB-C FIDO U2F security key built around a RISC-V CH32X035 and an ATECC608B secure element, with a capacitive touch pad for user presence.",
    highlights: [
      "Latin fides, trust: the same root FIDO takes its name from",
      "USB-C plug body grips the 0.8 mm board edge directly",
      "Firmware logic verified on host: CRC16, DER ECDSA, U2F APDU, CTAPHID framing",
      "Not yet run on silicon: no RISC-V toolchain on the build machine",
    ],
    modelId: "fides",
    repo: { url: "https://github.com/Kleavox/deltaT35-Fides", published: false },
  },
  {
    slug: "interim",
    designation: "deltaT52",
    codename: "Interim",
    stage: "design-complete",
    fabricated: false,
    mainIc: "nRF52840",
    dimensions: "29 × 43 mm, 2 layer",
    summary:
      "A wearable heart-rate monitor: MDBT50Q radio module, MAX30101 optical sensor on the back face, BMI270 IMU, and a complete battery charge and fuel-gauge path.",
    highlights: [
      "DRC and ERC both clean: zero violations, zero unconnected",
      "MAX30101 PPG sensor mounted on the reverse side",
      "Boost, charger, and fuel gauge on board (TPS61023, MCP73831, MAX17048)",
      "Successor to deltaT32",
    ],
    modelId: "interim",
    repo: { url: "https://github.com/Kleavox/deltaT52-Interim", published: false },
    successorOf: "deltat32",
  },
  {
    slug: "paritas",
    designation: "deltaT20",
    codename: "Paritas",
    stage: "in-progress",
    fabricated: false,
    mainIc: "RP2040",
    dimensions: "5 × 4, 20 keys, 1U (planned)",
    summary:
      "A one-handed QWERTY keyboard built on a mirror layer: the right half of the keyboard folds onto the left hand instead of disappearing.",
    highlights: [
      "Layout being validated on a donor Cacah (KBDKSP) macropad",
      "KMK on CircuitPython now; QMK once the layout settles",
      "Custom PCB specified: bare RP2040, USB-C, hotswap MX",
      "Paritas means both mirror symmetry and parity: the point where Δt reaches zero",
    ],
    modelId: null,
    repo: { url: "https://github.com/Kleavox/deltaT20-Paritas", published: false },
  },
];

export function boardBySlug(slug: string): Board | undefined {
  return boards.find((board) => board.slug === slug);
}
