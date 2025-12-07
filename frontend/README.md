# Todo Application Frontend

A comprehensive task management application built with Next.js 16+, TypeScript, and Tailwind CSS. This application provides a complete solution for managing tasks with authentication, filtering, sorting, and search capabilities.

## Features

- **Authentication**: Secure user authentication with Better Auth
- **Task Management**: Create, update, delete, and mark tasks as complete
- **Filtering & Sorting**: Filter by status and sort by various criteria
- **Search**: Real-time task search functionality
- **Responsive Design**: Mobile-first responsive interface
- **Dark Mode**: Built-in dark/light theme support
- **Type Safety**: Strict TypeScript typing throughout
- **Performance Optimized**: Memoized components and efficient rendering

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Security Features

- **Secure Token Storage**: Uses sessionStorage instead of localStorage for JWT tokens
- **Input Sanitization**: XSS prevention through input sanitization
- **Error Handling**: Proper error boundaries and user feedback
- **API Security**: Centralized API client with proper authentication headers

## Performance Optimizations

- **Component Memoization**: TaskList and TaskItem components are memoized
- **Optimized Rendering**: Use of useMemo for expensive calculations
- **Efficient Data Fetching**: Optimized API calls with proper caching
- **Bundle Optimization**: Tree-shaken dependencies and code splitting

## Architecture

- **Type Safety**: Centralized TypeScript type definitions in `types.ts`
- **Component Structure**: Modular, reusable React components
- **API Layer**: Centralized API client in `lib/api.ts`
- **Utilities**: Common utilities in `lib/utils.ts`
- **Error Handling**: Global error boundaries for graceful error recovery

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
