# Luxe Leather Co. - Next.js E-commerce Platform

Modern e-commerce platform for Luxe Leather Co., migrated from static HTML to Next.js with TypeScript and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Font:** Inter (Google Fonts)
- **Icons:** Material Symbols Outlined
- **State Management:** React Context API
- **Utilities:** clsx, tailwind-merge

## 🎨 Design System

### Colors
- **Primary:** `#137fec` (Blue)
- **Background:** `#FAFAF8` (Light) / `#0d141b` (Dark)
- **Surface:** `#ffffff` (Light) / `#1a2632` (Dark)

### Typography
- **Font Family:** Inter
- **Font Sizes:** Responsive scale using Tailwind defaults

### Components
All components support **dark mode** and are fully typed with TypeScript.

## 📁 Project Structure

```
├── app/                    # Next.js pages (App Router)
├── components/
│   ├── ui/                # Core UI components
│   ├── storefront/        # Storefront-specific components
│   └── admin/             # Admin-specific components
├── contexts/              # React contexts (theme, cart, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## 🧩 Available Components

### Core UI
- `Button` - 5 variants, 3 sizes
- `Input` - With labels, errors, icons
- `Card` - 3 variants, configurable padding
- `Badge` - 7 color variants
- `Modal` - Full-featured dialog

### Usage Example

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md">
  Click Me
</Button>
```

## 🌙 Dark Mode

Dark mode is automatically detected from system preferences and persists in localStorage.

```tsx
import useTheme from '@/hooks/useTheme';

const { theme, toggleTheme } = useTheme();
```

## 🔧 Development

### Component Library
Visit `/` during development to see all components showcased.

### Adding New Components
1. Create component in appropriate directory
2. Export from component file
3. Update documentation

### Styling Guidelines
- Use Tailwind utility classes
- Follow dark mode pattern: `class="bg-white dark:bg-gray-900"`
- Use design system tokens defined in `globals.css`

## 📝 Migration Status

- ✅ Project Setup
- ✅ Design System
- ✅ Core Components
- 🚧 Storefront Pages (In Progress)
- ⏳ Admin Pages (Pending)

## 🎯 Next Steps

1. Migrate Homepage
2. Create product listing page
3. Implement shopping cart
4. Add admin dashboard

## 📄 License

Private - Luxe Leather Co.
