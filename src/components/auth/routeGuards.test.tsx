import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { ManagerRoute } from "./ManagerRoute";

const mockedUseAuth = vi.mocked(useAuth);

const baseAuth = {
  user: null as any,
  profile: null as any,
  roles: [] as string[],
  loading: false,
  signOut: vi.fn(),
  session: null,
};

const setAuth = (overrides: Partial<typeof baseAuth>) => {
  mockedUseAuth.mockReturnValue({ ...baseAuth, ...overrides } as any);
};

const Sentinel = () => <div>PROTECTED</div>;

const renderWithRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>);

beforeEach(() => {
  mockedUseAuth.mockReset();
});

describe("ProtectedRoute", () => {
  it("does not render children when user is unauthenticated", () => {
    setAuth({ user: null, profile: null });
    renderWithRouter(
      <ProtectedRoute>
        <Sentinel />
      </ProtectedRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });

  it("renders children when user is authenticated and active", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
    });
    renderWithRouter(
      <ProtectedRoute>
        <Sentinel />
      </ProtectedRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });
});

describe("AdminRoute", () => {
  it("does not render children for non-admin role", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
      roles: ["contributor"],
    });
    renderWithRouter(
      <AdminRoute>
        <Sentinel />
      </AdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });

  it("renders children when role includes admin", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
      roles: ["admin"],
    });
    renderWithRouter(
      <AdminRoute>
        <Sentinel />
      </AdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });
});

describe("ManagerRoute", () => {
  it("does not render children for contributor role", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
      roles: ["contributor"],
    });
    renderWithRouter(
      <ManagerRoute>
        <Sentinel />
      </ManagerRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });

  it("renders children for manager role", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
      roles: ["manager"],
    });
    renderWithRouter(
      <ManagerRoute>
        <Sentinel />
      </ManagerRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });

  it("renders children for admin role", () => {
    setAuth({
      user: { id: "u1" },
      profile: { id: "u1", status: "active" },
      roles: ["admin"],
    });
    renderWithRouter(
      <ManagerRoute>
        <Sentinel />
      </ManagerRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });
});
