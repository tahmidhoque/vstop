# Ordering System Webapp

A mobile-first ordering system webapp with separate end-user and admin interfaces, password-protected access, product management, stock tracking, and order management. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

### End User Features

- Password-protected store access
- Browse products with real-time stock levels
- Shopping basket with persistent state
- Checkout with username entry
- Stock validation (prevents ordering out-of-stock items)

### Admin Features

- Separate admin login area
- Dashboard with order statistics
- Product management (add, edit, delete, adjust stock)
- Order management (view, edit, cancel, fulfill)
- Settings to change end user password

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS (mobile-first)
- **Authentication**: Custom password-based auth with session management
- **Deployment**: Vercel (serverless functions)

## Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL database (or any PostgreSQL database)
- Vercel account (for deployment)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Session
SESSION_SECRET="your-secret-key-here-change-in-production"

# Initial passwords (optional, defaults provided)
ADMIN_PASSWORD="admin123"
CUSTOMER_PASSWORD="customer123"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial passwords
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the end user login.

Access admin at [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Default Passwords

After running the seed script:

- **Admin**: `admin123` (change this immediately in production!)
- **Customer**: `customer123` (change via admin settings)

## Project Structure

```
vstop/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed.ts                # Database seeding script
├── src/
│   ├── app/                   # Next.js app router pages
│   │   ├── page.tsx          # End user login
│   │   ├── store/            # Storefront pages
│   │   └── admin/            # Admin pages
│   ├── components/           # React components
│   │   ├── auth/            # Authentication components
│   │   ├── store/            # Store components
│   │   └── admin/            # Admin components
│   ├── lib/                  # Utilities and server actions
│   └── types/                 # TypeScript types
└── package.json
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Import your project in Vercel

3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `SESSION_SECRET` - A secure random string for session encryption

4. Vercel will automatically:
   - Install dependencies
   - Run `prisma generate`
   - Build the application
   - Deploy to production

5. After first deployment, run the seed script manually or set up initial passwords via database:
   ```bash
   npm run db:seed
   ```

## Database Schema

- **Password**: Stores hashed passwords for admin and customer access
- **Product**: Product catalogue with name, price, and stock
- **Order**: Customer orders with username and status
- **OrderItem**: Items in each order with quantities and prices

## Security Considerations

- Passwords are hashed using bcrypt
- SQL injection prevention via Prisma
- XSS protection (React default)
- Session-based authentication
- Separate admin and customer access

## Mobile-First Design

All interfaces are optimised for mobile devices with:

- Touch-friendly buttons (minimum 44px height)
- Responsive grid layouts
- Sticky basket on mobile
- Bottom navigation for admin
- Optimised for on-the-go usage

## License

Private project
