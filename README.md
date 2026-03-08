# IHG Hotel Search Application

An AI-powered conversational hotel search application built with Angular 17+ that provides an intuitive interface for searching and exploring hotels in New York City.

## Features

- **AI-Powered Search**: Natural language queries powered by Google Gemini AI
- **Interactive Maps**: Leaflet maps with custom brand-styled markers
- **Responsive Design**: Optimized layouts for desktop (split-screen) and mobile (full-screen chat)
- **Smart Filtering**: Real-time hotel filtering by brand, location, amenities, price, and rating
- **Conversational Refinement**: Context-aware follow-up queries and helper tag suggestions
- **Date Selection**: Integrated date picker with guest count selection
- **Hotel Details**: Comprehensive detail views with image galleries, amenities, and pricing

## Technology Stack

- **Angular 17+** - Standalone components with TypeScript strict mode
- **RxJS** - Reactive state management
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **Flatpickr** - Date range selection
- **Google Gemini AI** - Natural language processing (gemini-2.0-flash-exp)
- **Jest** - Unit testing framework
- **fast-check** - Property-based testing

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ihg-hotel-search
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts between Angular 17 and some packages.

### 3. Configure API Key

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

> **Security Note**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 4. Start the Backend Server

The application requires a Node.js backend to serve the API configuration:

```bash
node server.js
```

The server will start on `http://localhost:3000` and serve:
- `/api/config` - API configuration endpoint
- Hotel data and static assets

### 5. Start the Development Server

In a new terminal window:

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you make changes to source files.

## Available Scripts

### Development

- `npm start` - Start development server on port 4200
- `npm run build` - Build for production (output in `dist/`)
- `npm run watch` - Build in watch mode

### Testing

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Linting

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues automatically

## Project Structure

```
ihg-hotel-search/
├── src/
│   ├── app/
│   │   ├── components/          # UI components
│   │   │   ├── chat.component.*
│   │   │   ├── hotel-card.component.*
│   │   │   ├── map.component.*
│   │   │   ├── input.component.*
│   │   │   ├── helper-tags.component.*
│   │   │   ├── date-picker.component.*
│   │   │   ├── landing.component.*
│   │   │   ├── hotel-detail-drawer.component.*
│   │   │   ├── hotel-detail-bottom-sheet.component.*
│   │   │   ├── desktop-layout.component.*
│   │   │   ├── mobile-layout.component.*
│   │   │   └── thinking-animation.component.*
│   │   ├── services/            # Business logic services
│   │   │   ├── ai.service.ts           # Gemini AI integration
│   │   │   ├── hotel.service.ts        # Hotel data & filtering
│   │   │   ├── conversation.service.ts # State management
│   │   │   ├── config.service.ts       # Configuration loading
│   │   │   ├── map.service.ts          # Map utilities
│   │   │   └── date.service.ts         # Date utilities
│   │   ├── models/              # TypeScript interfaces
│   │   │   ├── hotel.model.ts
│   │   │   ├── conversation-state.model.ts
│   │   │   ├── message.model.ts
│   │   │   ├── search-criteria.model.ts
│   │   │   ├── ai-response.model.ts
│   │   │   └── ...
│   │   └── app.component.ts     # Root component
│   ├── assets/                  # Static assets
│   │   ├── logos/               # Brand logos
│   │   └── landing-desktop.png
│   ├── styles.css               # Global styles
│   └── main.ts                  # Application entry point
├── hotels.json                  # Hotel data
├── server.js                    # Backend server
├── .env                         # Environment variables (create from .env.example)
├── .env.example                 # Environment template
├── jest.config.js               # Jest configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── angular.json                 # Angular CLI configuration
└── package.json                 # Dependencies and scripts
```

## Configuration

### API Configuration

The application loads its API key from the backend server at `/api/config`. The server reads from the `.env` file:

```javascript
// server.js
app.get('/api/config', (req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY
  });
});
```

### Environment Files

- `.env` - Local environment variables (not committed)
- `.env.example` - Template for environment variables

## Architecture

### Component Hierarchy

```
AppComponent
├── LandingComponent (initial view)
└── DesktopLayoutComponent | MobileLayoutComponent
    ├── ChatComponent
    │   ├── ThinkingAnimationComponent
    │   ├── HotelCardComponent (inline, mobile only)
    │   └── DatePickerComponent
    ├── HelperTagsComponent
    ├── InputComponent
    ├── MapComponent
    ├── HotelCardComponent (grid/scroll)
    └── HotelDetailDrawerComponent | HotelDetailBottomSheetComponent
```

### State Management

The application uses RxJS BehaviorSubjects for reactive state management:

- **ConversationService**: Manages conversation state, message history, and last displayed hotels
- **Component Communication**: Parent-to-child via `@Input()`, child-to-parent via `@Output()`

### Filtering Pipeline

Hotels are filtered in this order:
1. Brand filter
2. Sentiment/location filter (OR logic)
3. Price range filter
4. Amenities filter (OR logic)
5. Rating filter
6. Sort (price_asc, price_desc, rating_desc)

## Responsive Design

The application uses a single breakpoint at **1024px**:

- **Desktop (> 1024px)**: Split-screen layout with chat on left (33%), map/results on right (67%)
- **Mobile (≤ 1024px)**: Full-screen chat with inline cards, map overlay on demand

## Accessibility

The application follows WCAG 2.1 AA guidelines:

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for modals and drawers
- Color contrast ratios ≥ 4.5:1
- Screen reader compatibility

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for detailed accessibility documentation.

## Testing

### Unit Tests

Located alongside source files with `.spec.ts` extension:

```bash
npm test
```

### Property-Based Tests

Located with `.pbt.spec.ts` extension, using fast-check:

```bash
npm test -- --testPathPattern=pbt
```

### E2E Tests

Located with `.e2e.spec.ts` extension:

```bash
npm test -- --testPathPattern=e2e
```

## Troubleshooting

### Port Already in Use

If port 4200 or 3000 is already in use:

```bash
# For Angular dev server
ng serve --port 4201

# For backend server
PORT=3001 node server.js
```

### API Key Issues

If you see "API key not available" errors:

1. Verify `.env` file exists and contains `GEMINI_API_KEY`
2. Restart the backend server (`node server.js`)
3. Check browser console for configuration loading errors

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear Angular cache
rm -rf .angular
```

## Deployment

### Vercel Deployment

This application is optimized for deployment on Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Set environment variable: `vercel env add GEMINI_API_KEY`
4. Deploy: `vercel --prod`

The project includes:
- ✅ `vercel.json` - Vercel configuration with routing and headers
- ✅ `api/config.js` - Serverless function for API configuration
- ✅ Optimized build budgets (2MB initial, 5MB max)
- ✅ `.vercelignore` - Excludes unnecessary files

### Other Platforms

The application can be deployed to any platform that supports:
- Static file hosting for Angular build output
- Serverless functions or Node.js runtime for API endpoints
- Environment variable configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues and questions:
- Check existing [GitHub Issues](link-to-issues)
- Review [QUICK_START.md](./QUICK_START.md) for quick setup guide
- Review [API_SETUP.md](./API_SETUP.md) for API configuration details
