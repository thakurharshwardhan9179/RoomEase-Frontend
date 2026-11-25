import { X, ShieldCheck, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TenantProfileModalProps {
  tenant: any;
  onClose: () => void;
}

export default function TenantProfileModal({ tenant, onClose }: TenantProfileModalProps) {
  const navigate = useNavigate();

  if (!tenant) return null;

  return (
    /* Modal Backdrop Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* Modal Box Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 border border-[#E3E6DE]">
        
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF0E9] bg-[#F7F6F0]/60">
          <h2 className="text-xs font-medium text-[#294436]">Tenant Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white border border-[#E3E6DE] flex items-center justify-center text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436] transition shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-[#2C4136]">
          
          {/* Main Avatar & Top Details Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-16 w-16 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] text-[#356248] font-medium flex items-center justify-center text-xl shadow-sm">
                {tenant.fullName ? tenant.fullName.substring(0, 2).toUpperCase() : "TN"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#294436]">{tenant.fullName}</h3>
                  <span className="inline-flex items-center gap-1 bg-[#E8EFE8] text-[#356248] px-2 py-0.5 rounded-md text-[9px] font-medium">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <p className="text-[11px] text-[#859083] mt-0.5">RoomEase Tenant</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-[#F7EEDC] text-[#9B712F]">
              {tenant.status || "DueSoon"}
            </span>
          </div>

          {/* Stats Box Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F7F6F0]/60 border border-[#E3E6DE] text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Total Rent</p>
              <p className="text-xs font-medium text-[#294436] mt-1">
                ₹{tenant.totalRent ? tenant.totalRent.toLocaleString("en-IN") : "14,000"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F6F0]/60 border border-[#E3E6DE] text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A2634B]">Balance Due</p>
              <p className="text-xs font-medium text-[#A2634B] mt-1">
                ₹{tenant.balanceDue ? tenant.balanceDue.toLocaleString("en-IN") : "14,000"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F6F0]/60 border border-[#E3E6DE] text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Rooms</p>
              <p className="text-xs font-medium text-[#294436] mt-1">
                {tenant.rooms && tenant.rooms.length > 0 ? tenant.rooms.length : 1}
              </p>
            </div>
          </div>

          {/* About & Contact Info 2-Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-[#E3E6DE] bg-white space-y-1.5 shadow-sm">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#55755A]">About</h4>
              <p className="text-xs text-[#859083] leading-relaxed">
                Active resident in RoomEase property system. Verified occupancy and payment record.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E3E6DE] bg-white space-y-1.5 shadow-sm">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#55755A]">Contact Info</h4>
              <div className="space-y-1 text-xs text-[#36503E]">
                <div className="flex justify-between">
                  <span className="text-[#859083]">Phone:</span>
                  <span className="font-medium text-[#294436]">{tenant.mobileNumber || "+91 9977691941"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859083]">Email:</span>
                  <span className="font-medium text-[#294436]">tenant@roomease.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859083]">Languages:</span>
                  <span className="font-medium text-[#294436]">Hindi, English</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Property Details */}
          <div className="p-4 rounded-xl border border-[#E3E6DE] bg-white shadow-sm space-y-1.5">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#55755A]">Assigned Rooms & Property</h4>
            <div className="flex items-center gap-2 pt-0.5">
              <Building2 className="h-4 w-4 text-[#356248]" />
              <span className="text-xs font-medium text-[#294436]">
                Comfort Stay — Room 103 (Bed 1)
              </span>
            </div>
          </div>

          {/* Recent Payments Section */}
          <div className="p-4 rounded-xl border border-[#E3E6DE] bg-[#F7F6F0]/60 space-y-1">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Recent Payments</h4>
            <p className="text-xs text-[#859083]">No previous payment history available.</p>
          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3.5 bg-[#F7F6F0]/60 border-t border-[#EEF0E9] flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/tenants/${tenant.tenantId}/pay`);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640] transition"
            >
              Record Payment
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}