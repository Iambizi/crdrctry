import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.scss';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const verificationItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/pending', label: 'Pending Items', icon: '⏳' },
];

const managementItems: NavItem[] = [
  { href: '/admin/designers', label: 'Designers', icon: '👔' },
  { href: '/admin/brands', label: 'Brands', icon: '🏢' },
  { href: '/admin/batch-update', label: 'Batch Update', icon: '📝' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>Fashion Directory</h1>
          <span>Admin Dashboard</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <h2>Verification</h2>
            {verificationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  pathname === item.href ? styles.active : ''
                }`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navSection}>
            <h2>Management</h2>
            {managementItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  pathname === item.href ? styles.active : ''
                }`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Fashion Directory Admin</h1>
          
          <div className={styles.search}>
            <input 
              type="search" 
              placeholder="Search..." 
              aria-label="Search"
            />
            <span className={styles.icon}>🔍</span>
          </div>

          <div className={styles.actions}>
            <button className="button-secondary">Export</button>
            <button className="button-primary">View All</button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
