"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  UserCheck,
  ShieldCheck
} from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Teachers", href: "/teachers", icon: UserCheck },
  { name: "Parents", href: "/parents", icon: ShieldCheck },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-20 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-black tracking-tight text-white">Admin portal test</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-200 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <UserButton />
          <div className="text-sm">
            <p className="font-semibold text-slate-100">Admin Account</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </>
  );
}
