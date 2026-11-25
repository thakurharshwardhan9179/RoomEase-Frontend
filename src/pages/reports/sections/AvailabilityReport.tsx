import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Property } from "../../../api/properties.api";

import AvailabilityTable from "../availability/AvailabilityTable";
import AllBedsDrawer from "../availability/AllBedsDrawer";
import OccupiedBedsDrawer from "../availability/OccupiedBedsDrawer";
import VacantBedsDrawer from "../availability/VacantBedsDrawer";
import RoomDetailsDrawer from "../availability/RoomDetailsDrawer";
 
import type {
  AvailabilityItem,
  AvailabilityTotals,
} from "../report.types";

interface AvailabilityReportProps {
  availability: AvailabilityItem[];
  totals: AvailabilityTotals;
  properties: Property[];
}

type DrawerType =
  | "rooms"
  | "beds"
  | "occupied"
  | "vacant"
  | null;

export default function AvailabilityReport({
  availability,
  totals,
  properties,
}: AvailabilityReportProps) {
  const navigate = useNavigate();

  const [drawer, setDrawer] =
    useState<DrawerType>(null);

  const [drawerPropertyId, setDrawerPropertyId] =
    useState<string | null>(null);

  const propertyOptions = properties.map(
    (property) => ({
      propertyId: property.propertyId,
      propertyName: property.propertyName,
    })
  );

  const openDrawer = (
    type: Exclude<DrawerType, null>,
    propertyId?: string
  ) => {
    setDrawerPropertyId(
      propertyId || null
    );

    setDrawer(type);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setDrawerPropertyId(null);
  };

  return (
    <>
      <AvailabilityTable
        items={availability}
        totals={totals}

        onAllRoomsClick={() =>
          openDrawer("rooms")
        }

        onAllBedsClick={() =>
          openDrawer("beds")
        }

        onAllOccupiedClick={() =>
          openDrawer("occupied")
        }

        onAllVacantClick={() =>
          openDrawer("vacant")
        }

        onPropertyClick={(
          propertyId: string
        ) =>
          navigate(
            `/properties/${propertyId}`
          )
        }

        onRoomsClick={(
          propertyId: string
        ) =>
          openDrawer(
            "rooms",
            propertyId
          )
        }

        onBedsClick={(
          propertyId: string
        ) =>
          openDrawer(
            "beds",
            propertyId
          )
        }

        onOccupiedClick={(
          propertyId: string
        ) =>
          openDrawer(
            "occupied",
            propertyId
          )
        }

        onVacantClick={(
          propertyId: string
        ) =>
          openDrawer(
            "vacant",
            propertyId
          )
        }
      />

      {/* =================================================
          ROOM DETAILS
      ================================================= */}
      <RoomDetailsDrawer
        open={drawer === "rooms"}
        propertyId={drawerPropertyId}
        properties={propertyOptions}
        onClose={closeDrawer}
        onOpenProperty={(
          propertyId: string
        ) => {
          closeDrawer();

          navigate(
            `/properties/${propertyId}`
          );
        }}
      />

      {/* =================================================
          ALL BEDS
      ================================================= */}
      <AllBedsDrawer
        open={drawer === "beds"}
        propertyId={drawerPropertyId}
        properties={propertyOptions}
        onClose={closeDrawer}
        onCheckIn={(
          propertyId: string,
          bedId: string
        ) => {
          closeDrawer();

          navigate(
            `/properties/${propertyId}/checkin/${bedId}`
          );
        }}
        onTenant={(tenantId: string) => {
          closeDrawer();

          navigate(
            `/tenants/${tenantId}`
          );
        }}
        onOperations={() => {
          closeDrawer();

          navigate("/operations");
        }}
      />

      {/* =================================================
          VACANT BEDS
      ================================================= */}
      <VacantBedsDrawer
        open={drawer === "vacant"}
        propertyId={drawerPropertyId}
        properties={propertyOptions}
        onClose={closeDrawer}
        onCheckIn={(
          propertyId: string,
          bedId: string
        ) => {
          closeDrawer();

          navigate(
            `/properties/${propertyId}/checkin/${bedId}`
          );
        }}
      />

      {/* =================================================
          OCCUPIED BEDS
      ================================================= */}
      <OccupiedBedsDrawer
        open={drawer === "occupied"}
        propertyId={drawerPropertyId}
        properties={propertyOptions}
        onClose={closeDrawer}
        onTenant={(tenantId: string) => {
          closeDrawer();

          navigate(
            `/tenants/${tenantId}`
          );
        }}
      />
    </>
  );
}