# OALASS Database Design Standards

## Primary Key and Foreign Key Naming Convention

### 📋 **IMPORTANT RULES TO FOLLOW:**

#### 1. **Primary Key Naming Pattern:**
```sql
-- Table name: users
-- Primary key: users_id

-- Table name: orders  
-- Primary key: orders_id

-- Table name: categories
-- Primary key: categories_id
```

#### 2. **Foreign Key Naming Pattern:**
```sql
-- When referencing users table in orders table:
-- Foreign key: users_id

-- When referencing categories table in products table:
-- Foreign key: categories_id
```

#### 3. **Prisma Model Template:**
```prisma
model TableName {
  table_name_id    String   @id @default(cuid()) @map("table_name_id")
  // ... other fields
  foreign_table_id String   @map("foreign_table_id")  // Foreign key
  
  // Relationship
  foreignTable ForeignTable @relation(fields: [foreign_table_id], references: [foreign_table_id], onDelete: Cascade)
  
  @@map("table_name")
}
```

### 🎯 **Benefits of This Convention:**

1. **Clear Relationships**: Easy to identify which table a foreign key references
2. **No Confusion**: `users_id` always refers to the users table
3. **Consistent Naming**: All primary keys follow the same pattern
4. **Error Prevention**: Reduces database relationship errors
5. **Better Documentation**: Schema is self-documenting

### 📊 **Current OALASS Tables:**

#### Users Table
- **Primary Key**: `users_id`
- **Purpose**: Store user authentication and profile data
- **Referenced by**: accounts, sessions

#### Accounts Table  
- **Primary Key**: `accounts_id`
- **Foreign Key**: `users_id` → references users.users_id
- **Purpose**: OAuth account linkages

#### Sessions Table
- **Primary Key**: `sessions_id` 
- **Foreign Key**: `users_id` → references users.users_id
- **Purpose**: User session management

#### Verification Tokens Table
- **Primary Key**: `verification_tokens_id`
- **Purpose**: Email verification and password reset tokens

### 🔧 **When Creating New Tables:**

1. Always start with `{table_name}_id` as primary key
2. Use `@id @default(cuid())` for unique identifiers
3. Add `@map("{table_name}_id")` for database column mapping
4. Foreign keys should be named after the referenced table: `{referenced_table}_id`
5. Add proper relationship annotations with onDelete behavior

### 📝 **Example for Future Tables:**

```prisma
model Order {
  orders_id         String   @id @default(cuid()) @map("orders_id")
  users_id          String   @map("users_id")     // FK to users
  products_id       String   @map("products_id")  // FK to products
  total_amount      Decimal
  status            String
  createdAt         DateTime @default(now())
  
  // Relationships
  user    User    @relation(fields: [users_id], references: [users_id], onDelete: Cascade)
  product Product @relation(fields: [products_id], references: [products_id], onDelete: Restrict)
  
  @@map("orders")
}
```

### ⚠️ **Remember:**
- **ALWAYS** use this naming convention for new tables
- **ALWAYS** document relationships clearly
- **ALWAYS** consider onDelete behavior (Cascade, Restrict, SetNull)
- **ALWAYS** use meaningful table and column names

---
*This convention ensures clean, maintainable, and error-free database relationships in the OALASS system.*
