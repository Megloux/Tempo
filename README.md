# Fitness Class Scheduling System

A comprehensive web application for managing fitness class schedules, instructors, and class assignments for boutique fitness studios.

## Features

### 1. Scheduling Dashboard
- Weekly schedule grid with time slots from 5:30 AM to 8:00 PM in 30-minute increments
- Color-coded classes by type (Lagree, Strength, Boxing, Stretch, PT)
- Filter view by class type or view all classes at once
- Add, edit, and remove classes from the schedule

### 2. Class Management
- Add predefined classes for specific days/times
- Manual addition of new classes with day, type, and time selection
- Automatic instructor assignment based on qualifications and availability
- Manual editing of instructor assignments

### 3. Instructor Management
- Store instructor information (name, email, phone, qualifications)
- Track minimum/maximum classes per week for each instructor
- Manage instructor qualifications (which class types they can teach)
- Record availability/unavailability for scheduling purposes

### 4. Instructor Self-Registration
- Separate interface for instructors to submit their information
- Select class types they're qualified to teach
- Specify availability by day and time periods
- Mark unavailable days and time slots

### 5. Schedule Generation
- Automatically assign instructors to classes based on qualifications
- Respect minimum/maximum teaching loads
- Consider instructor availability when making assignments
- Balance teaching loads across the instructor team

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account (for cloud data storage)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your Supabase project:
   - Create a new project at https://supabase.com
   - Create the following tables in your Supabase database:
     - `instructors`: For storing instructor information
     - `schedule`: For storing the class schedule
     - `locked_assignments`: For storing locked class assignments
   - Get your Supabase URL and anon key from the API settings

4. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm start
   ```

## Deployment

### Deploying to Netlify

This project is configured for easy deployment to Netlify:

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Add the following environment variables in the Netlify dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Deploy your site

The included `netlify.toml` file handles the build configuration and routing automatically.

### Database Setup

Before using the application in production, make sure to set up the proper database schema in Supabase:

1. Create the following tables:
   - `instructors` (id, name, email, phone, qualifications, min_classes, max_classes, availability)
   - `schedule` (id, data)
   - `locked_assignments` (id, assignments)

2. Set up appropriate Row Level Security (RLS) policies to secure your data
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technology Stack

- React (with functional components and hooks)
- React Router for navigation
- TailwindCSS for styling
- Supabase for cloud data storage and authentication
- Recharts for analytics visualization
- LocalStorage as fallback for data persistence

## Project Structure

```
/src
  /components         # React components
    Dashboard.js      # Main scheduling dashboard
    InstructorManagement.js # Instructor management interface
    InstructorRegistration.js # Instructor self-registration
    LoadingSpinner.js # Loading indicator for Supabase operations
    AppContent.js     # Content wrapper with loading state handling
  /context            # Context providers for state management
    ClassScheduleContext.js # Main state management with Supabase integration
  supabaseClient.js   # Supabase client configuration
  App.js              # Main application component
  index.js            # Entry point
.env                  # Environment variables for Supabase credentials
netlify.toml          # Netlify deployment configuration
  index.css           # Global styles with Tailwind imports
```

## Usage

### Dashboard
- View the complete schedule
- Filter by class type
- Generate automatic schedules
- Add new classes

### Instructor Management
- View and edit instructor details
- Manage instructor availability
- Track instructor workload

### Instructor Registration
- Self-service form for new instructors
- Collect qualifications and availability

## Data Persistence

The application uses localStorage to persist data between sessions. In a production environment, this would be replaced with a proper backend database.
