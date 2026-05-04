import UserTable from "@/components/UserTable";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Users</h1>
      </div>

      <UserTable />
    </div>
  );
}
