"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen hidden md:flex">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold font-inter tracking-tight text-blue-600">
          Teacher Portal
        </h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        FKS Platform &copy; 2026
      </div>
    </div>
  );
}
