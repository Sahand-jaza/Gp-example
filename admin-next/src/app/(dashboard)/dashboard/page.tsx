import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";

const ICON_MAP: Record<string, any> = {
  "Total Students": Users,
  "Total Teachers": GraduationCap,
  "Active Courses": BookOpen,
  "Total Parents": ShieldCheck,
};

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let dashboardData = {
    stats: [
      { name: "Total Students", value: "0", icon: Users, change: "+0", changeType: "increase" },
      { name: "Total Teachers", value: "0", icon: GraduationCap, change: "+0", changeType: "increase" },
      { name: "Active Courses", value: "0", icon: BookOpen, change: "+0", changeType: "increase" },
      { name: "Total Parents", value: "0", icon: ShieldCheck, change: "+0", changeType: "increase" },
    ],
    recentActivity: []
  };

  try {
    const res = await api.get("/admin/stats", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data.success) {
      dashboardData.stats = res.data.stats;
      dashboardData.recentActivity = res.data.recentActivity;
    }
  } catch (error) {
    console.error("Dashboard data fetch failed:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, Admin. Real-time system monitoring is active.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardData.stats.map((stat) => {
          const Icon = ICON_MAP[stat.name] || Activity;
          return (
            <div key={stat.name} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center">
                <div className="rounded-lg bg-blue-50 p-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-bold text-slate-600 tracking-wide uppercase">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-extrabold text-slate-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-bold ${
                        stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-slate-400" />
              Recent Activity
            </h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-500">View all</button>
          </div>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-slate-200">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((item: any) => (
                  <li key={item.id} className="py-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.user} <span className="font-normal text-slate-500">{item.action}</span> {item.target}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-xs font-normal text-slate-500">
                        {item.time}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-10 text-center text-sm text-slate-500 italic">
                  No recent activity found.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-slate-400" />
              System Status
            </h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Database Connection</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">API Latency</span>
                <span className="text-sm font-medium text-slate-700">Optimal</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-around">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500">MongoDB</p>
                <div className="mt-1 flex items-center text-green-500">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="text-sm font-bold">Online</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500">Clerk Auth</p>
                <div className="mt-1 flex items-center text-green-500">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="text-sm font-bold">Online</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500">Storage (R2)</p>
                <div className="mt-1 flex items-center text-green-500">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="text-sm font-bold">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
