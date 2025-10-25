# App Flowchart

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

---
**Document Details**
- **Project ID**: 75f83eed-0d53-4247-ae65-f3e963001172
- **Document ID**: 8ad5672b-80b1-4dae-835f-10a095e32f2c
- **Type**: custom
- **Custom Type**: app_flowchart
- **Status**: completed
- **Generated On**: 2025-10-25T13:41:32.459Z
- **Last Updated**: N/A
