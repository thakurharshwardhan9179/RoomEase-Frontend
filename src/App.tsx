import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OtpVerify from "./pages/auth/OtpVerify";
import ForgotPassword from "./pages/auth/ForgotPassword";

import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import Documents from "./pages/onboarding/Documents";
import AddProperty from "./pages/onboarding/AddProperty";

import Properties from "./pages/properties/Properties";
import PropertyDetail from "./pages/properties/PropertyDetail";
import AddRoom from "./pages/properties/AddRoom";

import CheckIn from "./pages/tenants/CheckIn";
import Tenants from "./pages/tenants/Tenants";
import TenantDetail from "./pages/tenants/TenantDetail";
import RecordPayment from "./pages/tenants/RecordPayment";
import ManageRooms from "./pages/tenants/ManageRooms";

import Payments from "./pages/payments/Payments";
import Settings from "./pages/settings/Settings";
import NotFound from "./pages/system/NotFound";
import Expenses from "./pages/expenses/Expenses";

import PublicTask from "./pages/public/PublicTask";
import Operations from "./pages/operations/Operations";
import Staff from "./pages/staff/Staff";
import Menu from "./pages/menu/Menu";

import Guest from "./pages/public/Guest";
import GuestAccess from "./pages/public/GuestAccess";

import Services from "./pages/Services/Services";
import StaffPortal from "./pages/staff/StaffPortal";
import Reports from "./pages/reports/Reports";
import AuditLogs from "./pages/auditLogs/AuditLogs";
import Team from "./pages/system/Team";
import SuperAdminApp from "./super-admin/SuperAdminApp";
import PermissionGate from "./routes/PermissionGate";

export default function App() {
  return (
    <Routes>
      <Route path="/super-admin/*" element={<SuperAdminApp />} />
      {/* -------------------------------- */}
      {/* PUBLIC AUTH ROUTES */}
      {/* -------------------------------- */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/otp-verify"
        element={<OtpVerify />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* -------------------------------- */}
      {/* GUEST ROUTES */}
      {/* -------------------------------- */}

      <Route
        path="/guest/access"
        element={<GuestAccess />}
      />

      <Route
        path="/guest"
        element={<Guest />}
      />

      {/* -------------------------------- */}
      {/* STAFF PUBLIC ROUTES */}
      {/* -------------------------------- */}

      {/* Permanent Staff Portal */}
      <Route
        path="/staff/portal/:staffAccessToken"
        element={<StaffPortal />}
      />

      {/* Individual Task Magic Link */}
      <Route
        path="/staff/:actionToken"
        element={<PublicTask />}
      />

      <Route
        path="/public/tasks/:actionToken"
        element={<PublicTask />}
      />

      {/* -------------------------------- */}
      {/* OWNER PROTECTED ROUTES */}
      {/* -------------------------------- */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* DEFAULT */}
          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
          <Route
            path="team"
            element={<PermissionGate anyOf={["TEAM.USERS.READ", "TEAM.ROLES.READ"]}><Team /></PermissionGate>}
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<PermissionGate anyOf={["DASHBOARD.READ"]}><Dashboard /></PermissionGate>}
          />

          {/* PROPERTIES */}
          <Route
            path="/properties"
            element={<PermissionGate anyOf={["PROPERTIES.READ"]} moduleCode="PROPERTIES"><Properties /></PermissionGate>}
          />

          <Route
            path="/properties/:propertyId"
            element={<PermissionGate anyOf={["PROPERTIES.READ"]} moduleCode="PROPERTIES"><PropertyDetail /></PermissionGate>}
          />

          <Route
            path="/properties/:propertyId/add-room"
            element={<PermissionGate anyOf={["ROOMS.CREATE"]} moduleCode="ROOMS"><AddRoom /></PermissionGate>}
          />

          <Route
            path="/properties/:propertyId/checkin/:bedId"
            element={<PermissionGate anyOf={["TENANTS.CREATE"]} moduleCode="TENANTS"><CheckIn /></PermissionGate>}
          />

          {/* TENANTS */}
          <Route
            path="/tenants"
            element={<PermissionGate anyOf={["TENANTS.READ"]} moduleCode="TENANTS"><Tenants /></PermissionGate>}
          />

          <Route
            path="/tenants/:tenantId"
            element={<PermissionGate anyOf={["TENANTS.READ"]} moduleCode="TENANTS"><TenantDetail /></PermissionGate>}
          />

          <Route
            path="/tenants/:tenantId/pay"
            element={<PermissionGate anyOf={["PAYMENTS.CREATE"]} moduleCode="PAYMENTS"><RecordPayment /></PermissionGate>}
          />

          <Route
            path="/tenants/:tenantId/manage-rooms"
            element={<PermissionGate anyOf={["TENANTS.UPDATE"]} moduleCode="TENANTS"><ManageRooms /></PermissionGate>}
          />

          <Route
            path="/tenants/record-payment/:tenantId"
            element={<PermissionGate anyOf={["PAYMENTS.CREATE"]} moduleCode="PAYMENTS"><RecordPayment /></PermissionGate>}
          />

          {/* PAYMENTS */}
          <Route
            path="/payments"
            element={<PermissionGate anyOf={["PAYMENTS.READ", "PAYMENTS.CREATE"]} moduleCode="PAYMENTS"><Payments /></PermissionGate>}
          />

          {/* REPORTS */}
          <Route
            path="/reports"
            element={<PermissionGate anyOf={["ANALYTICS.READ"]} moduleCode="ANALYTICS"><Reports /></PermissionGate>}
          />

          {/* AUDIT LOGS */}
          <Route
            path="/audit-logs"
            element={<PermissionGate anyOf={["AUDIT_LOGS.READ"]}><AuditLogs /></PermissionGate>}
          />

          {/* ONBOARDING */}
          <Route
            path="/onboarding/documents"
            element={<PermissionGate anyOf={["DOCUMENTS.READ", "DOCUMENTS.CREATE"]}><Documents /></PermissionGate>}
          />

          <Route
            path="/onboarding/property"
            element={<PermissionGate anyOf={["PROPERTIES.CREATE"]} moduleCode="PROPERTIES"><AddProperty /></PermissionGate>}
          />

          {/* EXPENSES */}
          <Route
            path="/expenses"
            element={<PermissionGate anyOf={["EXPENSES.READ", "EXPENSES.CREATE"]} moduleCode="EXPENSES"><Expenses /></PermissionGate>}
          />

          {/* OPERATIONS */}
          <Route
            path="/operations"
            element={<PermissionGate anyOf={["TASKS.READ", "TASKS.CREATE"]} moduleCode="TASKS"><Operations /></PermissionGate>}
          />

          {/* STAFF */}
          <Route
            path="/staff"
            element={<PermissionGate anyOf={["STAFF.READ", "STAFF.CREATE"]} moduleCode="STAFF"><Staff /></PermissionGate>}
          />

          {/* MENU */}
          <Route
            path="/menu"
            element={<PermissionGate anyOf={["FNB.READ", "FNB.CREATE"]} moduleCode="FNB"><Menu /></PermissionGate>}
          />

          {/* SERVICES */}
          <Route
            path="/services"
            element={<PermissionGate anyOf={["FNB.READ", "FNB.CREATE"]} moduleCode="FNB"><Services /></PermissionGate>}
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={<PermissionGate anyOf={[]}><Settings /></PermissionGate>}
          />

          {/* OWNER UNKNOWN ROUTE */}
          <Route
            path="*"
            element={<NotFound />}
          />
        </Route>
      </Route>

      {/* -------------------------------- */}
      {/* GLOBAL FALLBACK */}
      {/* -------------------------------- */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
