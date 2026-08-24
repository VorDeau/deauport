import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import Meta from "./Meta";

beforeEach(() => {
  document.head.innerHTML = "";
});

const descriptions = () =>
  [...document.head.querySelectorAll('meta[name="description"]')].map((tag) =>
    tag.getAttribute("content"),
  );

describe("Meta", () => {
  it("membuang deskripsi statis yang ditulis emit-routes", async () => {
    document.head.innerHTML =
      '<meta name="description" data-emitted content="STATIS DARI emit-routes" />';

    render(<Meta title="T" description="DARI REACT" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(descriptions()).toEqual(["DARI REACT"]);
  });

  it("tidak menyentuh meta description yang bukan dari emit-routes", async () => {
    document.head.innerHTML = '<meta name="description" content="DITULIS PIHAK LAIN" />';

    render(<Meta title="T" description="DARI REACT" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(descriptions()).toContain("DITULIS PIHAK LAIN");
  });

  it("menaruh judulnya di depan judul statis sehingga document.title benar", async () => {
    document.head.innerHTML = "<title>STATIS</title>";

    render(<Meta title="DARI REACT" description="d" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(document.title).toBe("DARI REACT");
  });

  it("menyetel bahasa dokumen", async () => {
    render(<Meta title="T" description="d" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(document.documentElement.lang).toBe("en");
  });
});
