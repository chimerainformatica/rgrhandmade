"use client";

import React from "react";
import { Search, Bell, LayoutDashboard, Settings, Users } from "lucide-react";

export type IconProps = { size?: number; className?: string; title?: string } & React.SVGProps<SVGSVGElement>;

export function IconSearch(props: IconProps) { return <Search size={props.size ?? 18} {...props} />; }
export function IconBell(props: IconProps) { return <Bell size={props.size ?? 18} {...props} />; }
export function IconDashboard(props: IconProps) { return <LayoutDashboard size={props.size ?? 20} {...props} />; }
export function IconSettings(props: IconProps) { return <Settings size={props.size ?? 18} {...props} />; }
export function IconUsers(props: IconProps) { return <Users size={props.size ?? 18} {...props} />; }

const Icons = {
  Search: IconSearch,
  Bell: IconBell,
  Dashboard: IconDashboard,
  Settings: IconSettings,
  Users: IconUsers,
};

export default Icons;
