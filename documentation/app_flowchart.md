flowchart TD
  Start[Start] --> Auth{User Authenticated?}
  Auth -->|No| SignIn[Sign In]
  Auth -->|No| SignUp[Sign Up]
  SignIn --> Auth
  SignUp --> Auth
  Auth -->|Yes| Dashboard[Dashboard]
  Dashboard --> Members[Membership Management]
  Dashboard --> Attendance[Attendance Tracking]
  Dashboard --> POS[Point of Sale]
  Dashboard --> Reports[Reporting & Analytics]