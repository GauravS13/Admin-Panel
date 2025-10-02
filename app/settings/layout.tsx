import AdminLayout from '@/components/layout/AdminLayout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
