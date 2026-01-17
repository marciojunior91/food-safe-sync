import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuToggleProps {
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Mobile Menu Toggle Button
 * Shows hamburger menu on mobile devices to toggle sidebar
 */
export const MobileMenuToggle = ({ onToggle }: MobileMenuToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Toggle sidebar visibility
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.setAttribute('data-state', newState ? 'open' : 'closed');
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = newState ? 'hidden' : '';
    
    onToggle?.(newState);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      const target = e.target as HTMLElement;
      
      if (sidebar && !sidebar.contains(target) && !target.closest('.mobile-menu-toggle')) {
        handleToggle();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="mobile-menu-toggle fixed top-4 left-4 z-50 md:hidden"
      onClick={handleToggle}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
    </Button>
  );
};

/**
 * Hook to detect mobile device
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Hook to detect iPad
 */
export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width <= 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
};

/**
 * Hook to get viewport size
 */
export const useViewportSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth <= 1024,
    isDesktop: window.innerWidth > 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width <= 1024,
        isDesktop: width > 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

/**
 * Mobile-friendly overlay for sidebar
 */
export const MobileSidebarOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};
