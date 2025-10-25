# Echo - Audio Sharing Platform

A Twitter-like audio sharing platform where users can share audio recordings (echos) with location-based discovery.

## Features

### Home Page
- List view of echos similar to Twitter
- Each echo card displays:
  - Title of the echo
  - Distance from user (e.g., "1 mi away from you")
  - Re-echo count with icon
  - Seen count with icon
  - Re-echo button

### Re-echo Functionality
- Click re-echo button to confirm/cancel
- Green checkmark to confirm
- Red cross to cancel
- Toast notification shows success or cancellation
- Once re-echoed, button becomes disabled

### Echo Detail Page
- Displays when clicking on an echo
- Shows:
  - Echo title and stats
  - Animated audio visualizer (moving lines when playing)
  - Audio controls: play/pause, volume up/down, skip forward/backward
  - Progress bar with time display
  - Full transcript of the echo

### Navigation
- Bottom navbar with:
  - Home button (left)
  - Echo button (center, elevated)
  - Profile button (right)

### Design
- Mobile-first responsive design
- Clean, modern UI similar to Twitter
- Smooth animations and transitions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Canvas API for audio visualization

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page with echo list
│   │   ├── echo/[id]/page.tsx    # Echo detail page
│   │   ├── profile/page.tsx      # Profile page (placeholder)
│   │   ├── create-echo/page.tsx  # Create echo page (placeholder)
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── EchoCard.tsx          # Echo list item component
│   │   ├── Navbar.tsx            # Bottom navigation
│   │   ├── Toast.tsx             # Toast notifications
│   │   └── AudioVisualizer.tsx   # Audio waveform animation
│   └── types/
│       └── echo.ts               # TypeScript interfaces
```

## Next Steps

- Implement audio recording functionality
- Connect to backend API
- Add user authentication
- Implement actual location-based filtering
- Add audio file upload
- Add real-time updates
