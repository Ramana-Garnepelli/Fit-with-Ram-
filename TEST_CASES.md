# End-to-End Test Cases - Fit with Ram

## Test Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: In-Memory MongoDB
- Payment: PhonePe Sandbox (UAT)

## Test Categories

### 1. Authentication & Authorization

#### TC-001: User Signup (Regular User)
**Preconditions**: None
**Steps**:
1. Navigate to http://localhost:3000/signup
2. Enter name: "Test User"
3. Enter email: "testuser@example.com"
4. Enter phone: "9876543210"
5. Enter password: "Test@123"
6. Click "Sign Up"

**Expected Result**:
- ✅ User created successfully
- ✅ Redirected to /dashboard
- ✅ User role is 'user'
- ✅ Token stored in localStorage

#### TC-002: Admin Signup (Restricted Email)
**Preconditions**: None
**Steps**:
1. Navigate to http://localhost:3000/signup
2. Enter name: "Admin User"
3. Enter email: "ramana.garnepelli16@gmail.com"
4. Enter phone: "7036592919"
5. Enter password: "Admin@123"
6. Click "Sign Up"

**Expected Result**:
- ✅ User created with 'admin' role
- ✅ Redirected to /admin
- ✅ Admin dashboard accessible

#### TC-003: User Login
**Preconditions**: User account exists
**Steps**:
1. Navigate to http://localhost:3000/login
2. Enter email: "testuser@example.com"
3. Enter password: "Test@123"
4. Click "Login"

**Expected Result**:
- ✅ Login successful
- ✅ Redirected to /dashboard
- ✅ User data loaded
- ✅ Login day recorded

#### TC-004: Invalid Login Credentials
**Preconditions**: None
**Steps**:
1. Navigate to http://localhost:3000/login
2. Enter email: "wrong@example.com"
3. Enter password: "WrongPass"
4. Click "Login"

**Expected Result**:
- ❌ Login fails
- ✅ Error message displayed
- ✅ User remains on login page

#### TC-005: Unauthorized Admin Access
**Preconditions**: Logged in as regular user
**Steps**:
1. Navigate to http://localhost:3000/admin

**Expected Result**:
- ✅ Redirected to /dashboard
- ✅ Admin panel not accessible

### 2. Program Selection & Viewing

#### TC-006: View All Programs
**Preconditions**: None
**Steps**:
1. Navigate to http://localhost:3000/programs

**Expected Result**:
- ✅ All 3 programs displayed (Muscle Building, Fat Loss, Strength Training)
- ✅ Each program shows details
- ✅ "Select Program" button visible

#### TC-007: Select Program (Not Logged In)
**Preconditions**: Not logged in
**Steps**:
1. Navigate to http://localhost:3000/programs
2. Click "Select Program" on any program

**Expected Result**:
- ✅ Redirected to /login
- ✅ After login, redirected to /pricing with planId

#### TC-008: Select Program (Logged In)
**Preconditions**: Logged in as user
**Steps**:
1. Navigate to http://localhost:3000/programs
2. Click "Select Program" on Muscle Building

**Expected Result**:
- ✅ Redirected to /pricing?planId=<muscle_building_id>
- ✅ Correct plan highlighted

### 3. Payment Flow

#### TC-009: View Pricing Page
**Preconditions**: Logged in
**Steps**:
1. Navigate to http://localhost:3000/pricing

**Expected Result**:
- ✅ All plans displayed with prices
- ✅ "Pay Now" buttons visible
- ✅ Plan details shown

#### TC-010: Initiate Payment
**Preconditions**: Logged in, on pricing page
**Steps**:
1. Click "Pay Now" on Muscle Building plan
2. Observe payment modal/confirmation

**Expected Result**:
- ✅ Payment request sent to backend
- ✅ PhonePe payment initiated
- ✅ Redirected to PhonePe simulator
- ✅ Amount is ₹1.00 (100 paise)

#### TC-011: Complete Payment (Success)
**Preconditions**: On PhonePe simulator
**Steps**:
1. Click "Pay" or "Success" on simulator
2. Wait for redirect

**Expected Result**:
- ✅ Redirected to /payment/success?id=<transaction_id>
- ✅ Payment status verified
- ✅ "Payment Successful" message shown
- ✅ Auto-redirect to dashboard after 3 seconds

#### TC-012: Payment Status Verification
**Preconditions**: Payment completed
**Steps**:
1. Check database for payment record
2. Check user's purchases array

**Expected Result**:
- ✅ Payment status = 'paid'
- ✅ User has purchase record
- ✅ User has access to plan
- ✅ activePlanType updated
- ✅ currentDay set to 1

#### TC-013: Payment Failure
**Preconditions**: On PhonePe simulator
**Steps**:
1. Click "Fail" on simulator
2. Wait for redirect

**Expected Result**:
- ✅ Redirected to /payment/success
- ✅ "Payment Failed" message shown
- ✅ Error details displayed
- ✅ "Try Again" button available

### 4. User Dashboard

#### TC-014: View Dashboard (New User)
**Preconditions**: Logged in, no purchases
**Steps**:
1. Navigate to http://localhost:3000/dashboard

**Expected Result**:
- ✅ Dashboard loads
- ✅ Days Logged In: 1
- ✅ Current Streak: 1
- ✅ Active Plan: "No active plan"
- ✅ Vitality form visible

#### TC-015: View Dashboard (After Purchase)
**Preconditions**: Logged in, purchased a plan
**Steps**:
1. Navigate to http://localhost:3000/dashboard

**Expected Result**:
- ✅ Active Plan shows purchased plan name
- ✅ Current Day: 1
- ✅ Workout and diet plans accessible
- ✅ Progress tracking visible

#### TC-016: Update Vitality Data
**Preconditions**: Logged in
**Steps**:
1. Navigate to dashboard
2. Enter height: 175 cm
3. Enter weight: 70 kg
4. Click "Update Profile"

**Expected Result**:
- ✅ Profile updated successfully
- ✅ Success message shown
- ✅ Data persisted in database
- ✅ Data visible on reload

#### TC-017: Login Streak Tracking
**Preconditions**: User logged in yesterday
**Steps**:
1. Login today
2. Check dashboard stats

**Expected Result**:
- ✅ Days Logged In incremented
- ✅ Current Streak maintained/incremented
- ✅ loginDays array updated

### 5. Admin Panel

#### TC-018: Access Admin Dashboard
**Preconditions**: Logged in as admin
**Steps**:
1. Navigate to http://localhost:3000/admin

**Expected Result**:
- ✅ Admin dashboard loads
- ✅ Statistics displayed (total users, revenue, active plans)
- ✅ Navigation menu visible

#### TC-019: View All Users
**Preconditions**: Logged in as admin
**Steps**:
1. Navigate to http://localhost:3000/admin/users

**Expected Result**:
- ✅ User list displayed
- ✅ User details shown (name, email, role, purchases)
- ✅ "View Details" button for each user

#### TC-020: View User Details
**Preconditions**: Logged in as admin
**Steps**:
1. Navigate to /admin/users
2. Click "View Details" on a user

**Expected Result**:
- ✅ User profile page loads
- ✅ All user data displayed
- ✅ Purchase history shown
- ✅ Login history visible

#### TC-021: Delete User
**Preconditions**: Logged in as admin
**Steps**:
1. Navigate to /admin/users
2. Click "Delete" on a user
3. Confirm deletion

**Expected Result**:
- ✅ Confirmation dialog shown
- ✅ User deleted from database
- ✅ User list updated
- ✅ Success message displayed

#### TC-022: View Plans Management
**Preconditions**: Logged in as admin
**Steps**:
1. Navigate to http://localhost:3000/admin/plans

**Expected Result**:
- ✅ All plans listed
- ✅ Plan details visible
- ✅ Edit/Delete options available

### 6. Navigation & UI

#### TC-023: Navbar (Not Logged In)
**Preconditions**: Not logged in
**Steps**:
1. Navigate to homepage

**Expected Result**:
- ✅ "Login" button visible
- ✅ "Sign Up" button visible
- ✅ Navigation links work

#### TC-024: Navbar (Logged In)
**Preconditions**: Logged in
**Steps**:
1. Navigate to any page

**Expected Result**:
- ✅ User name displayed
- ✅ "Dashboard" link visible
- ✅ "Logout" button visible
- ✅ Login/Signup hidden

#### TC-025: Logout
**Preconditions**: Logged in
**Steps**:
1. Click "Logout" button

**Expected Result**:
- ✅ User logged out
- ✅ Token removed from localStorage
- ✅ Redirected to homepage
- ✅ Protected routes inaccessible

### 7. Edge Cases & Error Handling

#### TC-026: Duplicate Email Signup
**Preconditions**: User exists
**Steps**:
1. Try to signup with existing email

**Expected Result**:
- ❌ Signup fails
- ✅ Error message: "User already exists"

#### TC-027: Invalid Payment ID
**Preconditions**: None
**Steps**:
1. Navigate to /payment/success?id=INVALID_ID

**Expected Result**:
- ✅ Payment verification fails
- ✅ Error message shown
- ✅ No database updates

#### TC-028: Expired Session
**Preconditions**: Token expired
**Steps**:
1. Try to access protected route

**Expected Result**:
- ✅ Redirected to login
- ✅ Session expired message

#### TC-029: Network Error During Payment
**Preconditions**: Backend offline
**Steps**:
1. Try to initiate payment

**Expected Result**:
- ✅ Error message shown
- ✅ User can retry
- ✅ No partial payment created

### 8. Responsive Design

#### TC-030: Mobile View
**Preconditions**: None
**Steps**:
1. Resize browser to mobile width (375px)
2. Navigate through all pages

**Expected Result**:
- ✅ All pages responsive
- ✅ Navigation menu adapts
- ✅ Forms usable
- ✅ No horizontal scroll

#### TC-031: Tablet View
**Preconditions**: None
**Steps**:
1. Resize browser to tablet width (768px)
2. Navigate through all pages

**Expected Result**:
- ✅ Layout adapts properly
- ✅ All features accessible

### 9. Performance

#### TC-032: Page Load Time
**Preconditions**: None
**Steps**:
1. Measure page load times

**Expected Result**:
- ✅ Homepage loads < 2 seconds
- ✅ Dashboard loads < 3 seconds
- ✅ No console errors

#### TC-033: API Response Time
**Preconditions**: None
**Steps**:
1. Monitor API calls

**Expected Result**:
- ✅ Auth APIs < 500ms
- ✅ Payment initiation < 1s
- ✅ Data fetching < 500ms

### 10. Security

#### TC-034: SQL Injection Prevention
**Preconditions**: None
**Steps**:
1. Try SQL injection in login form

**Expected Result**:
- ✅ Input sanitized
- ✅ No database breach

#### TC-035: XSS Prevention
**Preconditions**: None
**Steps**:
1. Try XSS in input fields

**Expected Result**:
- ✅ Scripts not executed
- ✅ Input escaped

#### TC-036: Password Security
**Preconditions**: None
**Steps**:
1. Check database for password storage

**Expected Result**:
- ✅ Passwords hashed (bcrypt)
- ✅ Not stored in plain text

## Test Execution Checklist

- [ ] All authentication flows
- [ ] Program selection and viewing
- [ ] Complete payment flow (success)
- [ ] Payment failure handling
- [ ] User dashboard features
- [ ] Admin panel access and features
- [ ] Navigation and UI elements
- [ ] Edge cases and error scenarios
- [ ] Responsive design (mobile/tablet)
- [ ] Performance benchmarks
- [ ] Security validations

## Bug Report Template

**Bug ID**: BUG-XXX
**Severity**: Critical/High/Medium/Low
**Test Case**: TC-XXX
**Description**: 
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected Result**:
**Actual Result**:
**Screenshots/Logs**:
**Status**: Open/In Progress/Fixed

## Test Results Summary

**Total Test Cases**: 36
**Passed**: TBD
**Failed**: TBD
**Blocked**: TBD
**Pass Rate**: TBD%
