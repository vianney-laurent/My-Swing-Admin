import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { AdminNavItem } from '../../types/navigation';
import { ADMIN_NAV_ITEMS } from '../../lib/navigation';
import { UserMenu } from './UserMenu';

type Breadcrumb = {
  label: string;
  href?: string;
};

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  headerActions?: ReactNode;
  navItems?: AdminNavItem[];
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  brandLabel?: string;
  brandHref?: string;
};

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function AppShell({
  title,
  description,
  actions,
  headerActions,
  navItems = ADMIN_NAV_ITEMS,
  breadcrumbs,
  children,
  brandLabel = 'My Swing Admin',
  brandHref = '/',
}: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  const currentPath = router.asPath;

  const renderNavItems = (items: AdminNavItem[]) =>
    items.map((item) => {
      const isActive = item.match
        ? item.match(currentPath)
        : currentPath === item.href;

      const linkProps = item.external
        ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
        : { href: item.href };

      return (
        <Link
          key={item.href}
          {...linkProps}
          className="ms-sidebar__nav-link"
          data-active={isActive ? 'true' : undefined}
        >
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <div className="ms-shell">
      {/* Sidebar Navigation */}
      <aside className="ms-sidebar" data-open={mobileMenuOpen ? 'true' : undefined}>
        <div className="ms-sidebar__header">
          <Link href={brandHref} className="ms-sidebar__brand">
            <div className="ms-sidebar__brand-logo">MS</div>
            <span>{brandLabel}</span>
          </Link>
          <button
            className="ms-sidebar__close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="ms-sidebar__content">
          <nav className="ms-sidebar__nav">
            {renderNavItems(navItems)}
          </nav>
        </div>

        <div className="ms-sidebar__footer">
          <UserMenu />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ms-main">
        <header className="ms-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="ms-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <h1 className="ms-header__title">{title}</h1>
          </div>

          <div className="ms-toolbar ms-toolbar--end">
            {headerActions ? <div className="ms-toolbar__actions">{headerActions}</div> : null}
          </div>
        </header>

        <div className="ms-content">
          {/* Page Header (Breadcrumbs + Description + Actions) */}
          <div className="ms-page-header">
            <div className="ms-page-header__main">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <div className="ms-breadcrumbs">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <span key={`${breadcrumb.label}-${index}`}>
                      {breadcrumb.href ? (
                        <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                      ) : (
                        breadcrumb.label
                      )}
                      {index < breadcrumbs.length - 1 ? (
                        <span className="ms-breadcrumbs__separator">/</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}

              {description ? (
                <p className="ms-page-header__description">{description}</p>
              ) : null}
            </div>

            {actions ? (
              <div className="ms-page-header__actions">{actions}</div>
            ) : null}
          </div>

          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {
        mobileMenuOpen && (
          <div
            className="ms-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )
      }
    </div >
  );
}
