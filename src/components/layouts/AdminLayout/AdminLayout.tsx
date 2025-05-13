'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.scss';
import SearchBar from '@/components/common/SearchBar';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const verificationItems: NavItem[] = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 4V8L10.6667 9.33333M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      href: '/admin/pending', 
      label: 'Pending Items', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H12.6667C13.403 2 14 2.59695 14 3.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 8L7.33333 9.33333L10.6667 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  const managementItems: NavItem[] = [
    { 
      href: '/admin/designers', 
      label: 'Designers', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10.6667 4C10.6667 5.47276 9.47276 6.66667 8 6.66667C6.52724 6.66667 5.33333 5.47276 5.33333 4C5.33333 2.52724 6.52724 1.33333 8 1.33333C9.47276 1.33333 10.6667 2.52724 10.6667 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 8.66667C5.05448 8.66667 2.66667 11.0545 2.66667 14M8 8.66667C10.9455 8.66667 13.3333 11.0545 13.3333 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      href: '/admin/brands', 
      label: 'Brands', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6L8 2L14 6M2 6L8 10M2 6V13L8 10M14 6L8 10M14 6V13L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      href: '/admin/batch-upload', 
      label: 'Batch Upload', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 10V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V10M8 10.6667L8 2M8 2L5.33333 4.66667M8 2L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>Fashion Directory</h1>
          <span>Admin Dashboard</span>
        </div>

        <div className={styles.nav}>
          <div className={styles.navSection}>
            <h2>Verification</h2>
            {verificationItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.icon}
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
                className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuButton}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1>Fashion Directory Admin</h1>
          </div>
          <div className={styles.headerRight}>
            <SearchBar placeholder="Search..." />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
