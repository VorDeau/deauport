import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactSection from "./ContactSection";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete window.turnstile;
});

async function fillForm() {
  const user = userEvent.setup({ delay: null });
  await user.type(screen.getByLabelText(/name/i), "Ada");
  await user.type(screen.getByLabelText(/email/i), "ada@example.test");
  await user.type(screen.getByLabelText(/message/i), "Hello there, this is a message.");
  await user.click(screen.getByRole("button", { name: /send/i }));
}

describe("ContactSection", () => {
  it("menolak kirim tanpa token verifikasi", async () => {
    render(<ContactSection />);
    await fillForm();
    expect(await screen.findByText(/verification/i)).toBeInTheDocument();
  });

  it("merender widget Turnstile secara eksplisit dan memakai token dari callback", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ message: "ok" }), { status: 200 }));

    const renderWidget = vi.fn((_container: HTMLElement, options: TurnstileRenderOptions) => {
      options.callback?.("widget-token");
      return "widget-1";
    });
    const removeWidget = vi.fn();
    window.turnstile = { render: renderWidget, reset: vi.fn(), remove: removeWidget };

    const view = render(<ContactSection />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    const call = renderWidget.mock.calls[0];
    if (!call) throw new Error("turnstile.render was not called");
    expect(call[1].sitekey).toBeTruthy();
    expect(call[1].theme).toBe("dark");

    await fillForm();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0];
    if (!request) throw new Error("fetch was not called");
    expect(JSON.parse(String(request[1]?.body))).toMatchObject({
      turnstileToken: "widget-token",
    });

    view.unmount();
    expect(removeWidget).toHaveBeenCalledWith("widget-1");
  });

  it("mengirim ke /api/contact dan melaporkan sukses", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ message: "ok" }), { status: 200 }));

    render(<ContactSection testToken="token-123" />);
    await fillForm();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, init] = call;
    expect(url).toBe("/api/contact");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: "Ada",
      email: "ada@example.test",
      turnstileToken: "token-123",
    });
    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
  });

  it("menampilkan pesan error dari server", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Rate limited." }), { status: 429 }),
    );
    render(<ContactSection testToken="token-123" />);
    await fillForm();
    expect(await screen.findByText(/rate limited/i)).toBeInTheDocument();
  });
});
