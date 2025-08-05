# HackPSU Email Forward Manager

A comprehensive email management and analytics system for the HackPSU hackathon event. This internal team tool provides email forwarding management, sponsorship outreach capabilities, and detailed SendGrid analytics for tracking email campaign performance.

## Project Overview

The HackPSU Email Forward Manager serves as a centralized platform for managing email operations during hackathon events. It combines three core functionalities: domain-based email forwarding management through Namecheap, automated sponsorship email campaigns, and comprehensive SendGrid analytics dashboards. The system is designed for event organizers who need efficient email management tools with detailed performance insights.

### Target Users and Primary Use Cases

- HackPSU event organizers managing email infrastructure
- Team members responsible for sponsor outreach and communication
- Analytics reviewers tracking email campaign performance and engagement

### Key Capabilities and Scope

- Real-time email forwarding configuration for hackpsu.org domain
- Template-based sponsorship email generation and sending
- Interactive SendGrid analytics dashboard with performance metrics
- Geographic email performance tracking and visualization
- Multi-format email template management and preview system

## Tech Stack

### Core Framework

- **Next.js** - React-based full-stack framework using App Router architecture for server-side rendering and API routes

### Styling & UI Components

- **Tailwind CSS** - Utility-first CSS framework for responsive design and consistent styling
- **shadcn/ui** - Modern React component library built on Radix UI primitives with accessible design patterns
- **Material-UI** - Additional component library for specific data visualization and form components
- **Radix UI** - Headless UI components providing accessibility and keyboard navigation foundations

### Authentication & Backend Integration

- **Firebase** - Authentication and real-time database services for user management and data persistence
- **Axios** - HTTP client for external API communication with error handling and request interceptors

### Form Handling & Validation

- **React Hook Form** - Performant form library with minimal re-renders and built-in validation
- **@hookform/resolvers** - Form validation resolvers for schema-based validation integration

### Analytics & Monitoring

- **PostHog** - Product analytics and user behavior tracking for application insights
- **SendGrid API** - Email delivery service integration for sending and analytics data retrieval

### Development Tools

- **TypeScript** - Static type checking for enhanced code reliability and developer experience
- **ESLint** - Code linting and style enforcement with Next.js and React-specific rules
- **Prettier** - Code formatting for consistent style across the codebase

## Architecture & Design Decisions

### App Router Structure

- Utilizes Next.js 15 App Router for file-based routing with layouts and server components
- API routes handle external service integration (SendGrid, Namecheap, Firebase)
- Client components manage interactive functionality while server components handle data fetching

### Authentication Strategy

- Firebase Authentication integrated through context providers for session management
- Environment-based configuration for multiple deployment environments
- Protected routes using AuthGuard wrapper components

### State Management

- React Context API for global state management (authentication, theme)
- TanStack Query for server state management, caching, and data synchronization
- Local component state for UI interactions and form management

### Styling Architecture

- Tailwind CSS with custom configuration for HackPSU brand colors and spacing
- Component-based styling with shadcn/ui for consistent design system
- Responsive design patterns for mobile and desktop compatibility

### Performance Optimizations

- Next.js standalone output configuration for optimized Docker deployments
- Package import optimization for Material-UI components to reduce bundle size
- Static asset optimization with proper caching headers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Yarn package manager
- Firebase project with authentication enabled
- SendGrid API key for email services
- Namecheap API credentials for domain management

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Copy environment variables and configure:
   ```bash
   cp .env.example .env.local
   ```
4. Configure the following environment variables:
   - Firebase configuration (API keys, project ID, auth domain)
   - SendGrid API key for email services
   - Namecheap API credentials (API key, username, client IP)
   - Base URL for API endpoints

### Available Scripts

- `yarn dev` - Start development server with Turbopack for faster builds
- `yarn build` - Create production build with optimizations
- `yarn start` - Start production server
- `yarn lint` - Run ESLint for code quality checks
- `yarn format` - Format code using Prettier

### Environment Setup

Create `.env.local` with required variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
SENDGRID_API_KEY=your_sendgrid_api_key
NAMECHEAP_API_KEY=your_namecheap_api_key
NAMECHEAP_API_USER=your_namecheap_username
NAMECHEAP_CLIENT_IP=your_client_ip
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/                      # Server-side API endpoints
│   │   ├── email/                # Email forwarding management API
│   │   └── sendgrid/             # SendGrid analytics and stats API
│   ├── email/                    # Email forwarding management page
│   ├── send/                     # Sponsorship email creation interface
│   ├── sendgrid/                 # Analytics dashboard pages
│   └── create-template/          # Email template creation tools
├── common/                       # Shared utilities and configurations
│   ├── api/                      # API client abstractions and hooks
│   ├── config/                   # Environment and Firebase configuration
│   ├── context/                  # React context providers
│   ├── namecheap/               # Namecheap API integration utilities
│   └── sendgrid/                # SendGrid utilities and type definitions
├── components/                   # Reusable UI components
│   └── ui/                      # shadcn/ui component library
└── lib/                         # Utility functions and helpers
```

## Key Features

### Email Forwarding Management

- Real-time viewing and editing of hackpsu.org email forwarding rules
- Bulk operations for adding, removing, and modifying forwarding entries
- Integration with Namecheap API for immediate DNS updates
- Validation and error handling for email address formats

### Sponsorship Email System

- Template-based email creation with dynamic field insertion
- Preview functionality for email content before sending
- Batch email sending capabilities with personalization
- Integration with SendGrid for reliable email delivery

### SendGrid Analytics Dashboard

- Comprehensive metrics including delivery rates, open rates, and click-through rates
- Time-series data visualization with interactive charts and graphs
- Geographic performance tracking with heatmap visualizations
- Detailed breakdowns of email status, engagement, and deliverability issues
- Customizable date ranges and aggregation periods for data analysis

## Deployment

The application is configured for containerized deployment with Docker support:

- Standalone Next.js build output for optimized container size
- Environment variable configuration for different deployment stages
- PostHog proxy configuration for analytics data collection
- Production-ready security headers and CORS configuration

## Contributing

### Code Standards and Best Practices

- TypeScript strict mode enabled for type safety
- ESLint configuration with Next.js and React-specific rules
- Prettier for consistent code formatting across the team
- Component composition patterns with proper separation of concerns

### Development Workflow Expectations

- Feature branches with descriptive names for all changes
- Code review process for all pull requests
- Testing of email functionality in development environment before production deployment
- Documentation updates for new features and API changes
