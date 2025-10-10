import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  CheckSquare,
  Settings,
  BarChart3,
  ShoppingCart,
  Target,
  FileText,
  DollarSign,
  TrendingUp,
  Network,
  Package2,
  Bell,
  FileDown
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavItem({ href, icon, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-green-100 text-green-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function AdminNav() {
  return (
    <nav className="space-y-2">
      <NavItem href="/admin" icon={<LayoutDashboard size={20} />}>
        <Link href="/admin" legacyBehavior>
          <a>Dashboard</a>
        </Link>
      </NavItem>
      <NavItem href="/admin/mlm" icon={<Target size={20} />}>
        MLM Control Panel
      </NavItem>
      <NavItem href="/admin/products" icon={<Package size={20} />}>
        Product Management
      </NavItem>
      <NavItem href="/admin/tasks" icon={<CheckSquare size={20} />}>
        Task Management
      </NavItem>
      <NavItem href="/admin/users" icon={<Users size={20} />}>
        User Management
      </NavItem>
      <NavItem href="/admin/orders" icon={<ShoppingCart size={20} />}>
        Order Management
      </NavItem>
      <NavItem href="/admin/financial" icon={<DollarSign size={20} />}>
        Financial Dashboard
      </NavItem>
      <NavItem href="/admin/financial/reports" icon={<FileText size={20} />}>
        Financial Reports
      </NavItem>
      <NavItem href="/admin/commissions" icon={<Target size={20} />}>
        Commission Management
      </NavItem>
      <NavItem href="/admin/blog" icon={<FileText size={20} />}>
        Blog Management
      </NavItem>
      <NavItem href="/admin/notifications" icon={<Bell size={20} />}>
        <Link href="/admin/notifications" legacyBehavior>
          <a>Notification Management</a>
        </Link>
      </NavItem>
      <NavItem href="/admin/reports" icon={<FileDown size={20} />}>
        <Link href="/admin/reports" legacyBehavior>
          <a>Reports & Data Export</a>
        </Link>
      </NavItem>
      <NavItem href="/admin/analytics" icon={<TrendingUp size={20} />}>
        Analytics Dashboard
      </NavItem>
      <NavItem href="/admin/analytics/users" icon={<Users size={20} />}>
        User Analytics
      </NavItem>
      <NavItem href="/admin/analytics/mlm" icon={<Network size={20} />}>
        MLM Analytics
      </NavItem>
      <NavItem href="/admin/analytics/products" icon={<Package2 size={20} />}>
        Product Analytics
      </NavItem>
      <NavItem href="/admin/analytics/tasks" icon={<CheckSquare size={20} />}>
        Task Analytics
      </NavItem>
      <NavItem href="/admin/analytics/blog" icon={<FileText size={20} />}>
        Blog Analytics
      </NavItem>
      <NavItem href="/admin/reports" icon={<BarChart3 size={20} />}>
        Reports & Analytics
      </NavItem>
      <NavItem href="/admin/settings" icon={<Settings size={20} />}>
        Settings
      </NavItem>
    </nav>
  );
} 