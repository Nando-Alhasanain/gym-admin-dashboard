# App Flow Document

# Gym Admin Dashboard App Flow

## Onboarding and Sign-In/Sign-Up
A brand-new user accesses the Gym Admin Dashboard by navigating to the public landing page. From this page, they can choose to sign in if they already have an account or sign up to create a new one. To create an account, the user clicks the sign-up link, which opens a page requesting their email address, a secure password, and confirmation of the password. Upon submitting the form, Better Auth handles email verification. The user receives an email with a verification link. Clicking this link confirms the account and redirects them to the sign-in page.

If the user forgets their password, they can click the "Forgot Password" link on the sign-in page. They are prompted to enter their registered email address and then receive a password reset link. Following the link allows them to set a new password. After setting the new password successfully, they are redirected to the sign-in page. To sign out at any time, the user clicks the profile icon in the header and selects "Sign Out," which ends their session and returns them to the public landing page.

## Main Dashboard or Home Page
After signing in, the user lands on the main dashboard. The layout centers around a responsive sidebar on the left, which provides navigation links to Members, Products, POS, Reports, and Settings. The header above displays the gym’s name, a theme toggle for light and dark modes, and the user’s avatar with a dropdown for account actions. The central content area shows an overview of key metrics including today’s check-in count, total revenue for the day, and active membership trends. Below these metrics are interactive charts visualizing attendance history and sales figures. From this default view, the user can click any card or chart element to navigate deeper into its corresponding section.

## Detailed Feature Flows and Page Transitions
The Membership Management section opens when the user clicks "Members" in the sidebar. A members list loads in a table format, fetching data from the server. The user can add a new member by clicking an "Add Member" button at the top of the page, which displays a form to enter personal details, contact information, and assign a membership plan. Upon saving, a unique QR code is generated and displayed. The user can also click an existing member’s name in the list to view or edit that member’s profile on a detail page. Changes to the profile, such as updating contact details or assigning a new plan, are submitted via API and reflected immediately in the list.

In the Attendance Tracking flow, the user navigates to the "Check-In" page. The page prompts the staff member to scan a member’s QR code using the device camera or to enter the member’s unique ID manually. When the QR code is scanned or the ID is submitted, the system verifies membership status by querying the database. If the membership is active, a new check-in record is created, and a success message is shown. If the membership is expired or invalid, an error alert informs the user of the issue.

The Point-of-Sale interface is accessed via the "POS" link. The page displays a catalog of products with pricing and stock levels in a grid or list format. The staff can add items to a cart by clicking an "Add to Cart" button on each product card. The cart slides in from the right, showing selected items, quantities, and total cost. When the staff submits the sale, an API endpoint processes the transaction, updates the product stock, logs the sale, and returns a receipt confirmation. After completion, the cart clears and the product stock numbers update in real time.

Reports are reached by clicking "Reports" in the sidebar. This page retrieves aggregated data for check-ins and sales from the backend. Interactive charts allow the user to filter by date range or membership plan. Clicking on a data point drills into detailed logs on a new page that lists individual check-in entries or transaction receipts. A download button lets the user export filtered data as a CSV file.

Administrators can access the Staff Management page through a hidden link in Settings. This page lists all staff members and their roles. From here, admins can invite new staff by entering an email address and assigning a role. Invitations are sent via email. Admins can also revoke access or change roles for existing staff, and the system enforces these permissions in real time.

## Settings and Account Management
Within the sidebar, the user selects "Settings" to open the account management area. The first section displays the user’s profile information, including name, email, and role. The user can update their display name or upload a new avatar. A separate tab allows changing the password by entering the current password and a new one. A notifications section offers toggles for email alerts on events such as new member sign-ups or low product stock. Another tab controls the visual theme settings, letting the user switch between light, dark, or system default modes.

Once changes are saved, the user returns to the main dashboard by clicking the dashboard icon in the sidebar or the brand logo in the header. All updated preferences apply immediately without requiring a page reload.

## Error States and Alternate Paths
If a user enters incorrect credentials on the sign-in page, an inline error message appears above the form fields indicating invalid email or password. During sign-up, if the email is already in use or the password does not meet security requirements, validation messages guide the user to correct the input. On the password reset page, submitting an unrecognized email prompts a discreet notification that the address is not registered.

In the members or products sections, any API failure such as network interruption displays a banner at the top of the page with a retry button. Checking in with an expired membership triggers an explicit alert with an explanation and a link to the member’s profile page for renewal. If the POS transaction fails, a modal appears detailing the error and suggesting corrective actions, such as adjusting the cart or checking network connectivity.

When the application loses connectivity entirely, a full-page overlay informs the user the app is offline and will automatically reconnect. All forms and navigation remain protected, and any attempted actions are queued until connectivity resumes.

## Conclusion and Overall App Journey
A user begins by visiting the landing page and signing up for an account, verifying their email, and then signing in. They arrive at the unified dashboard where key metrics inform daily gym operations. Navigating the sidebar, they manage members by creating profiles, generating QR codes, and editing plans. They record attendance through a check-in interface that validates membership status in real time. Sales are conducted in the POS section, where products are added to a cart, transactions are processed, and stock is updated automatically. Detailed reports and analytics provide visual insights into gym performance, while account settings let users manage their profile, security, and display preferences. Administrators further manage staff roles and permissions to ensure each team member has appropriate access. Throughout the experience, clear error handling and offline support maintain a smooth workflow. Users sign out when done and can return at any time to continue managing the gym efficiently.

---
**Document Details**
- **Project ID**: 75f83eed-0d53-4247-ae65-f3e963001172
- **Document ID**: b96b1dd8-99de-48f2-b85d-e157ad1e1384
- **Type**: custom
- **Custom Type**: app_flow_document
- **Status**: completed
- **Generated On**: 2025-10-25T13:43:29.411Z
- **Last Updated**: N/A
