// src/app/core/models/nav-item.model.ts
export interface NavItem {
  label: string;
  route: string;
  icon: string; // SVG path or emoji
  roles: string[];
  children?: NavItem[];
}