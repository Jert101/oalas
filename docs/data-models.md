# Data Models - OALASS

## Database Schema Overview

The OALASS system uses a MySQL database with Prisma ORM. The schema is designed to support a comprehensive leave management system with role-based access control, multi-stage approval workflows, and real-time notifications.

## Core Entities

### User Management

#### User
```sql
model User {
  users_id             String             @id @map("users_id")
  email                String             @unique
  password             String?
  name                 String
  firstName            String?
  lastName             String?
  middleName           String?
  suffix               String?
  profilePicture       String?            @db.Text
  isDepartmentHead     Boolean            @default(false)
  isEmailVerified      Boolean            @default(false)
  emailVerifiedAt      DateTime?
  resetToken           String?            @unique
  resetTokenExpiry     DateTime?
  isActive             Boolean            @default(true)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  department_id        Int?
  role_id              Int?
  status_id            Int?
}
```

#### Role
```sql
model Role {
  role_id     Int          @id @default(autoincrement()) @map("role_id")
  name        String       @unique
  description String?
  category_id Int?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

#### Department
```sql
model Department {
  department_id Int                @id @default(autoincrement()) @map("department_id")
  name          String             @unique
  description   String?
  category      DepartmentCategory
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}
```

### Leave Management

#### Leave Application
```sql
model LeaveApplication {
  leave_application_id Int               @id @default(autoincrement()) @map("leave_application_id")
  users_id             String            @map("users_id")
  calendar_period_id   Int?              @map("calendar_period_id")
  startDate            DateTime
  endDate              DateTime
  reason               String?           @db.Text
  status               ApplicationStatus @default(PENDING)
  appliedAt            DateTime          @default(now())
  reviewedAt           DateTime?
  reviewedBy           String?
  comments             String?           @db.Text
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  leave_type_id        Int
  paymentStatus        PaymentStatus     @default(PAID)
  numberOfDays         Int
  hours                Int
  specificPurpose      String?           @db.Text
  descriptionOfSickness String?          @db.Text
  medicalProof         String?           @db.Text
  // Dean approval fields
  deanReviewedAt       DateTime?
  deanReviewedBy       String?
  deanComments         String?           @db.Text
  deanRejectionReason  String?           @db.Text
  deanAcknowledgedRejection Boolean?     @default(false)
  deanAcknowledgedAt        DateTime?
  deanAcknowledgedBy        String?
}
```

#### Travel Order
```sql
model TravelOrder {
  travel_order_id      Int               @id @default(autoincrement()) @map("travel_order_id")
  users_id             String            @map("users_id")
  calendar_period_id   Int?              @map("calendar_period_id")
  destination          String
  purpose              String            @db.Text
  dateOfTravel         DateTime
  expectedReturn       DateTime
  transportationFee    Decimal           @db.Decimal(10, 2)
  seminarConferenceFee Decimal           @db.Decimal(10, 2)
  mealsAccommodations  Decimal           @db.Decimal(10, 2)
  totalCashRequested   Decimal           @db.Decimal(10, 2)
  supportingDocuments  String?           @db.Text
  remarks              String?           @db.Text
  status               ApplicationStatus @default(PENDING)
  appliedAt            DateTime          @default(now())
  reviewedAt           DateTime?
  reviewedBy           String?
  comments             String?           @db.Text
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  // Dean approval fields
  deanReviewedAt       DateTime?
  deanReviewedBy       String?
  deanComments         String?           @db.Text
  deanRejectionReason  String?           @db.Text
  deanAcknowledgedRejection Boolean?     @default(false)
  deanAcknowledgedAt        DateTime?
  deanAcknowledgedBy        String?
}
```

#### Leave Types
```sql
model leave_types {
  leave_type_id Int          @id @default(autoincrement()) @map("leave_type_id")
  name          String       @unique
  description   String?
  isActive      Boolean      @default(true)
  exempt_from_date_restriction Boolean @default(false) @map("exempt_from_date_restriction")
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

### Leave Balance System

#### Leave Balance
```sql
model LeaveBalance {
  leave_balance_id   Int            @id @default(autoincrement()) @map("leave_balance_id")
  users_id           String         @map("users_id")
  calendar_period_id Int            @map("calendar_period_id")
  status_id          Int            @map("status_id")
  allowedDays        Int
  usedDays           Int            @default(0)
  remainingDays      Int
  lastCalculated     DateTime       @default(now())
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  leave_type_id      Int            @map("leave_type_id")
  term_type_id       Int            @map("term_type_id")
}
```

#### Leave Limits
```sql
model LeaveLimit {
  leave_limit_id Int         @id @default(autoincrement()) @map("leave_limit_id")
  status_id      Int         @map("status_id")
  daysAllowed    Int
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  leave_type_id  Int         @map("leave_type_id")
  term_type_id   Int         @map("term_type_id")
}
```

### Calendar and Academic Periods

#### Calendar Period
```sql
model CalendarPeriod {
  calendar_period_id Int                @id @default(autoincrement()) @map("calendar_period_id")
  academicYear       String
  startDate          DateTime
  endDate            DateTime
  isCurrent          Boolean            @default(false)
  isActive           Boolean            @default(true)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  term_type_id       Int                @map("term_type_id")
}
```

#### Term Type
```sql
model TermType {
  term_type_id    Int              @id @default(autoincrement()) @map("term_type_id")
  name            String           @unique
  description     String?
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

### Notification System

#### Notification
```sql
model Notification {
  notification_id Int              @id @default(autoincrement()) @map("notification_id")
  title           String
  message         String           @db.Text
  type            NotificationType @default(INFO)
  isRead          Boolean          @default(false)
  link            String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  userId          String           @map("user_id")
}
```

### Probation System

#### Probation
```sql
model Probation {
  probation_id   Int             @id @default(autoincrement()) @map("probation_id")
  users_id       String          @unique @map("users_id")
  startDate      DateTime
  endDate        DateTime
  probationDays  Int
  status         ProbationStatus @default(ACTIVE)
  completionDate DateTime?
  isEmailSent    Boolean         @default(false)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}
```

### Account Setup

#### Account Setup Request
```sql
model AccountSetupRequest {
  id             Int      @id @default(autoincrement())
  email          String
  school_id      String   @unique
  department_id  Int
  role_id        Int
  display_name   String?
  picture        String?  @db.Text
  gender         String?
  phone          String?
  birthday       DateTime?
  address        String?
  status         String   @default("pending")
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}
```

## Enums

### Application Status
```sql
enum ApplicationStatus {
  PENDING
  DEAN_APPROVED
  DEAN_REJECTED
  APPROVED
  DENIED
  CANCELLED
}
```

### Department Category
```sql
enum DepartmentCategory {
  NON_TEACHING_PERSONNEL
  ACADEMIC_DEPARTMENT
}
```

### Probation Status
```sql
enum ProbationStatus {
  ACTIVE
  COMPLETED
}
```

### Payment Status
```sql
enum PaymentStatus {
  PAID
  UNPAID
}
```

### Notification Type
```sql
enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
}
```

## Relationships

### User Relationships
- **User → Department**: Many-to-One (users can belong to one department)
- **User → Role**: Many-to-One (users have one role)
- **User → Status**: Many-to-One (users have one status)
- **User → Leave Applications**: One-to-Many (users can have multiple applications)
- **User → Travel Orders**: One-to-Many (users can have multiple travel orders)
- **User → Notifications**: One-to-Many (users can have multiple notifications)

### Application Relationships
- **Leave Application → User**: Many-to-One (applications belong to one user)
- **Leave Application → Calendar Period**: Many-to-One (applications belong to one period)
- **Leave Application → Leave Type**: Many-to-One (applications have one leave type)
- **Leave Application → Reviewer**: Many-to-One (applications reviewed by one user)

### Balance and Limits
- **Leave Balance → User**: Many-to-One (balances belong to one user)
- **Leave Balance → Calendar Period**: Many-to-One (balances for one period)
- **Leave Balance → Leave Type**: Many-to-One (balances for one leave type)
- **Leave Limit → Status**: Many-to-One (limits for one status)
- **Leave Limit → Leave Type**: Many-to-One (limits for one leave type)
- **Leave Limit → Term Type**: Many-to-One (limits for one term type)

## Indexes

### Performance Indexes
- `users_email_idx`: Unique index on user email
- `leave_applications_status_idx`: Index on application status
- `leave_applications_period_status_idx`: Composite index on period and status
- `leave_applications_applied_at_idx`: Index on application date
- `notifications_user_read_idx`: Composite index on user and read status
- `notifications_created_at_idx`: Index on notification creation date

### Foreign Key Indexes
- `users_department_id_fkey`: Department foreign key
- `users_role_id_fkey`: Role foreign key
- `users_status_id_fkey`: Status foreign key
- `leave_applications_users_id_fkey`: User foreign key for applications
- `leave_applications_calendar_period_id_fkey`: Calendar period foreign key
- `leave_applications_leave_type_id_fkey`: Leave type foreign key

## Data Integrity Constraints

### Unique Constraints
- User email must be unique
- Account setup requests must have unique school_id
- Leave limits must be unique per status, term type, and leave type
- Leave balances must be unique per user, period, term type, and leave type

### Check Constraints
- Leave application start date must be before end date
- Travel order date of travel must be before expected return
- Leave balance remaining days must be non-negative
- Probation end date must be after start date

## Migration Strategy

The database uses Prisma migrations for schema changes:

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Data Seeding

The system includes seeders for:
- Admin users
- Leave types and form fields
- Department and role data
- Finance test data
- Leave limits and term types

```bash
# Run all seeders
npm run db:seed

# Run specific seeders
npm run db:seed:admin
npm run db:seed:leave-fields
npm run db:seed:finance
```
