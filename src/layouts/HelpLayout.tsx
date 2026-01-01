import React from "react";
import { Outlet } from "react-router-dom";

export default function HelpLayout() {
  return (
    <div className="bg-white min-h-screen">
      <Outlet />
    </div>
  );
}
