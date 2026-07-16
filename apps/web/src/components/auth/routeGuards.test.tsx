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

vi.mock("@/contexts/PlatformAdminContext", () => ({
  usePlatformAdmin: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/contexts/PlatformAdminContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { ManagerRoute } from "./ManagerRoute";
import { PlatformAdminRoute } from "./PlatformAdminRoute";
import { StatusRoute } from "./StatusRoute";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUsePlatformAdmin = vi.mocked(usePlatformAdmin);

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

const setPlatformAdmin = (isPlatformAdmin: boolean, loading = false) => {
  mockedUsePlatformAdmin.mockReturnValue({ isPlatformAdmin, loading } as any);
};

beforeEach(() => {
  mockedUseAuth.mockReset();
  mockedUsePlatformAdmin.mockReset();
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

describe("PlatformAdminRoute", () => {
  it("shows No Access instead of children for regular users", () => {
    setAuth({ user: { id: "u1" }, profile: { id: "u1", status: "active" }, roles: ["admin"] });
    setPlatformAdmin(false);
    renderWithRouter(
      <PlatformAdminRoute>
        <Sentinel />
      </PlatformAdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
    expect(screen.queryByText("No Access")).not.toBeNull();
  });

  it("renders children for platform admins", () => {
    setAuth({ user: { id: "u1" }, profile: { id: "u1", status: "active" } });
    setPlatformAdmin(true);
    renderWithRouter(
      <PlatformAdminRoute>
        <Sentinel />
      </PlatformAdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });

  it("renders neither children nor No Access while loading", () => {
    setAuth({ user: { id: "u1" }, profile: null, loading: true });
    setPlatformAdmin(false, true);
    renderWithRouter(
      <PlatformAdminRoute>
        <Sentinel />
      </PlatformAdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
    expect(screen.queryByText("No Access")).toBeNull();
  });

  it("does not render children for unauthenticated visitors", () => {
    setAuth({ user: null, profile: null });
    setPlatformAdmin(false);
    renderWithRouter(
      <PlatformAdminRoute>
        <Sentinel />
      </PlatformAdminRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });
});

describe("StatusRoute", () => {
  it("renders children when profile status matches requiredStatus", () => {
    setAuth({ user: { id: "u1" }, profile: { id: "u1", status: "pending" } });
    renderWithRouter(
      <StatusRoute requiredStatus="pending">
        <Sentinel />
      </StatusRoute>
    );
    expect(screen.queryByText("PROTECTED")).not.toBeNull();
  });

  it("does not render children for active users (they belong in the app)", () => {
    setAuth({ user: { id: "u1" }, profile: { id: "u1", status: "active" } });
    renderWithRouter(
      <StatusRoute requiredStatus="pending">
        <Sentinel />
      </StatusRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });

  it("does not render children when the status belongs on the other page", () => {
    setAuth({ user: { id: "u1" }, profile: { id: "u1", status: "inactive" } });
    renderWithRouter(
      <StatusRoute requiredStatus="pending">
        <Sentinel />
      </StatusRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });

  it("does not render children for unauthenticated visitors", () => {
    setAuth({ user: null, profile: null });
    renderWithRouter(
      <StatusRoute requiredStatus="pending">
        <Sentinel />
      </StatusRoute>
    );
    expect(screen.queryByText("PROTECTED")).toBeNull();
  });
});
