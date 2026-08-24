import type { Board, SoftwareProject } from "../data/types";

export type Role = {
  pad: string;
  text: string;
  border: string;
  wash: string;
};

export function boardFinish(board: Board): Role {
  if (board.fabricated) {
    return { pad: "bg-gold", text: "text-gold", border: "border-gold/45", wash: "kvx-wash-gold" };
  }
  if (board.stage === "in-progress") {
    return { pad: "bg-copper", text: "text-copper", border: "border-copper/40", wash: "kvx-wash-copper" };
  }
  if (board.stage === "archived") {
    return { pad: "bg-quiet", text: "text-quiet", border: "border-line", wash: "kvx-wash-interface" };
  }
  return { pad: "bg-hasl", text: "text-hasl", border: "border-hasl/30", wash: "kvx-wash-hasl" };
}

export function projectRole(status: SoftwareProject["status"]): Role {
  if (status === "active") {
    return { pad: "bg-ok", text: "text-ok", border: "border-ok/35", wash: "kvx-wash-sensing" };
  }
  if (status === "shipped") {
    return { pad: "bg-info", text: "text-info", border: "border-info/30", wash: "kvx-wash-data" };
  }
  return { pad: "bg-quiet", text: "text-quiet", border: "border-line", wash: "kvx-wash-interface" };
}
