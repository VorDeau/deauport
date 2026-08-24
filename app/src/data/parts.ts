import type { BoardModelId } from "./models.generated";

export type PartGroup =
  | "power"
  | "data"
  | "sensing"
  | "protection"
  | "interface"
  | "mechanical";

export type PartNote = {
  ref: string;
  part: string;
  role: string;
  group: PartGroup;
};

export const GROUP_STYLE: Record<
  PartGroup,
  { pad: string; text: string; wash: string }
> = {
  power: { pad: "bg-warn", text: "text-warn", wash: "kvx-wash-power" },
  data: { pad: "bg-info", text: "text-info", wash: "kvx-wash-data" },
  sensing: { pad: "bg-ok", text: "text-ok", wash: "kvx-wash-sensing" },
  protection: { pad: "bg-danger", text: "text-danger", wash: "kvx-wash-protection" },
  interface: { pad: "bg-quiet", text: "text-quiet", wash: "kvx-wash-interface" },
  mechanical: { pad: "bg-mech", text: "text-mech", wash: "kvx-wash-mechanical" },
};

export const BOARD_PARTS: Record<BoardModelId, readonly PartNote[]> = {
  keel: [
    { ref: "U2", part: "GL3510", role: "USB 3.0 Hub", group: "data" },
    { ref: "U1", part: "INA226", role: "Power Telemetry", group: "power" },
    { ref: "J2", part: "USB 3.0 Stack", role: "Downstream Ports", group: "data" },
    { ref: "J1", part: "USB-C", role: "Power Input", group: "power" },
    { ref: "J6", part: "Stacking Header", role: "To Pi 4 and EP-0152", group: "data" },
    { ref: "Q1", part: "P-FET", role: "Load Switch", group: "power" },
    { ref: "J3", part: "USB 3.0 Stack", role: "Link to Hub", group: "data" },
    { ref: "SW1", part: "Button", role: "Power", group: "interface" },
    { ref: "J12", part: "Header", role: "UPS Input", group: "power" },
    { ref: "F2", part: "Polyfuse", role: "Over-current", group: "protection" },
    { ref: "F3", part: "Polyfuse", role: "Over-current", group: "protection" },
    { ref: "F4", part: "Polyfuse", role: "Over-current", group: "protection" },
    { ref: "D1", part: "Diode", role: "Protection", group: "protection" },
    { ref: "D2", part: "Diode", role: "Protection", group: "protection" },
    { ref: "D3", part: "TVS", role: "Protection", group: "protection" },
    { ref: "LED1", part: "LED", role: "Indicator", group: "interface" },
    { ref: "Duct", part: "3D-Printed Duct", role: "Vent to Pi SoC", group: "mechanical" },
  ],
  interim: [
    { ref: "U2", part: "MDBT50Q", role: "nRF52840 MCU and Radio", group: "data" },
    { ref: "U4", part: "MAX30101", role: "Heart Rate Sensor, Rear", group: "sensing" },
    { ref: "U3", part: "BMI270", role: "IMU", group: "sensing" },
    { ref: "U6", part: "W25Q128", role: "QSPI Flash", group: "data" },
    { ref: "U5", part: "BMP390", role: "Barometer", group: "sensing" },
    { ref: "U11", part: "TPS61023", role: "5 V Boost", group: "power" },
    { ref: "U8", part: "MCP73831", role: "Battery Charger", group: "power" },
    { ref: "U9", part: "MAX17048", role: "Fuel Gauge", group: "power" },
    { ref: "J2", part: "USB-C", role: "Charge and Data", group: "power" },
    { ref: "U7", part: "LDO", role: "3.3 V Rail", group: "power" },
    { ref: "U10", part: "LDO", role: "1.8 V Rail", group: "power" },
    { ref: "U1", part: "TVS", role: "USB Protection", group: "protection" },
    { ref: "Q1", part: "Power Mux", role: "Battery or USB", group: "power" },
    { ref: "L1", part: "2.2 µH Inductor", role: "Boost Converter", group: "power" },
    { ref: "SW1", part: "Button", role: "Side", group: "interface" },
    { ref: "SW2", part: "Button", role: "Side", group: "interface" },
    { ref: "D1", part: "LED", role: "Indicator", group: "interface" },
    { ref: "D5", part: "LED", role: "Indicator", group: "interface" },
  ],
  fides: [
    { ref: "U1", part: "CH32X035F8U6", role: "RISC-V MCU", group: "data" },
    { ref: "U4", part: "ATECC608B", role: "Secure Element", group: "data" },
    { ref: "J1", part: "USB-C Plug", role: "Male, Edge Mount", group: "interface" },
    { ref: "U2", part: "USBLC6-2SC6", role: "USB ESD Protection", group: "protection" },
    { ref: "U3", part: "ME6211C33M5G-N", role: "3.3 V LDO", group: "power" },
    { ref: "SW1", part: "NANOT160AS", role: "BOOT Button", group: "interface" },
    { ref: "D1", part: "LED", role: "Indicator", group: "interface" },
    { ref: "R1", part: "5.1 k", role: "CC Pull-down", group: "power" },
    { ref: "R3", part: "4.7 k", role: "BOOT Pull-up", group: "data" },
    { ref: "R4", part: "1 k", role: "LED Series", group: "interface" },
    { ref: "R5", part: "10 k", role: "I²C Pull-up", group: "data" },
    { ref: "R6", part: "10 k", role: "I²C Pull-up", group: "data" },
    { ref: "C1", part: "4.7 µF", role: "VBUS Bulk", group: "power" },
    { ref: "C3", part: "4.7 µF", role: "3V3 Bulk", group: "power" },
    { ref: "C2", part: "100 nF", role: "MCU Decoupling", group: "power" },
    { ref: "C4", part: "100 nF", role: "ATECC Decoupling", group: "power" },
  ],
};

export const CALLOUT_COUNT = 6;
