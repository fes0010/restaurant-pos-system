# Requirements Document

## Introduction

The Debt Management feature provides a dedicated interface for tracking, managing, and collecting customer debts in the POS system. When customers make purchases on credit (payment method: "debt"), the system creates transactions with a "debt_pending" status. This feature enables store staff to view outstanding debts, record payments (partial or full), track payment history, and monitor overall debt health through analytics. Additionally, the feature includes customer credit limit management to control credit exposure, dashboard KPIs for quick debt insights, and an expenses tracking page for monitoring business expenditures.

## Glossary

- **Debt**: An outstanding balance owed by a customer for a transaction completed with the "debt" payment method
- **Debt Transaction**: A transaction record with `payment_method = 'debt'` and `status = 'debt_pending'`
- **Debt Payment**: A payment made by a customer to reduce or clear an outstanding debt
- **Outstanding Balance**: The remaining amount owed on a debt transaction after accounting for all payments
- **Debt Settlement**: The act of recording a payment that fully clears a debt (outstanding balance becomes zero)
- **Partial Payment**: A payment that reduces but does not fully clear an outstanding debt
- **Debt Aging**: The categorization of debts by how long they have been outstanding (e.g., 0-30 days, 31-60 days, 61-90 days, 90+ days)
- **Credit Limit**: The maximum amount of outstanding debt a customer is approved to carry at any time
- **Credit Approved Customer**: A customer who has been granted permission to make purchases on credit with a defined credit limit
- **Available Credit**: The difference between a customer's credit limit and their current outstanding debt
- **Expense**: A business expenditure recorded for tracking operational costs
- **Expense Category**: A classification for expenses (e.g., utilities, rent, supplies, salaries)
- **POS System**: The Point of Sale application managing inventory, transactions, and customer data

## Requirements

### Requirement 1

**User Story:** As a store manager, I want to view all outstanding customer debts in one place, so that I can monitor credit exposure and prioritize collection efforts.

#### Acceptance Criteria

1. WHEN a user navigates to the debt management page THEN the POS System SHALL display a list of all transactions with debt_pending status
2. WHEN displaying debt transactions THEN the POS System SHALL show customer name, transaction date, original amount, outstanding balance, and days overdue for each entry
3. WHEN a user applies a search filter THEN the POS System SHALL filter the debt list by customer name or transaction number
4. WHEN a user applies a date range filter THEN the POS System SHALL display only debts created within the specified date range
5. WHEN a user sorts the debt list THEN the POS System SHALL allow sorting by date, amount, customer name, or days overdue

### Requirement 2

**User Story:** As a store cashier, I want to record payments against customer debts, so that I can accurately track what customers still owe.

#### Acceptance Criteria

1. WHEN a user selects a debt transaction and enters a payment amount THEN the POS System SHALL create a debt payment record linked to that transaction
2. WHEN a payment amount equals the outstanding balance THEN the POS System SHALL update the transaction status to "completed" and set outstanding balance to zero
3. WHEN a payment amount is less than the outstanding balance THEN the POS System SHALL reduce the outstanding balance by the payment amount and maintain debt_pending status
4. WHEN a user attempts to record a payment exceeding the outstanding balance THEN the POS System SHALL reject the payment and display a validation error
5. WHEN a debt payment is recorded THEN the POS System SHALL capture the payment method, payment date, and the user who recorded the payment

### Requirement 3

**User Story:** As a store manager, I want to view the payment history for each debt, so that I can track customer payment behavior and resolve disputes.

#### Acceptance Criteria

1. WHEN a user selects a debt transaction THEN the POS System SHALL display all payments made against that debt in chronological order
2. WHEN displaying payment history THEN the POS System SHALL show payment date, amount, payment method, and the user who recorded each payment
3. WHEN displaying a debt with payments THEN the POS System SHALL show the original transaction amount, total paid, and remaining balance

### Requirement 4

**User Story:** As a store manager, I want to see debt summary statistics, so that I can understand the overall credit health of the business.

#### Acceptance Criteria

1. WHEN a user views the debt management page THEN the POS System SHALL display the total outstanding debt amount across all customers
2. WHEN a user views the debt management page THEN the POS System SHALL display the count of customers with outstanding debts
3. WHEN a user views the debt management page THEN the POS System SHALL display debt aging breakdown showing amounts in 0-30, 31-60, 61-90, and 90+ day categories
4. WHEN a user views the debt management page THEN the POS System SHALL display the total debt collected in the current month

### Requirement 5

**User Story:** As a store manager, I want to view debts grouped by customer, so that I can see each customer's total exposure and prioritize follow-ups.

#### Acceptance Criteria

1. WHEN a user switches to customer view THEN the POS System SHALL display a list of customers with outstanding debts
2. WHEN displaying customer debt summary THEN the POS System SHALL show customer name, contact information, total outstanding amount, and number of pending transactions
3. WHEN a user selects a customer THEN the POS System SHALL display all debt transactions for that customer with their individual balances

### Requirement 6

**User Story:** As a store owner, I want debt data to be persisted reliably, so that payment records are accurate and auditable.

#### Acceptance Criteria

1. WHEN a debt payment is recorded THEN the POS System SHALL persist the payment record to the database before confirming success to the user
2. WHEN storing debt payment data THEN the POS System SHALL serialize payment records using JSON format for the API layer
3. WHEN retrieving debt payment data THEN the POS System SHALL deserialize JSON responses into typed payment objects
4. WHEN a database operation fails during payment recording THEN the POS System SHALL display an error message and maintain the previous debt state

### Requirement 7

**User Story:** As a store manager, I want to set credit limits for approved customers, so that I can control credit exposure and prevent excessive debt accumulation.

#### Acceptance Criteria

1. WHEN a user edits a customer record THEN the POS System SHALL allow setting a credit limit amount and credit approval status
2. WHEN a customer is marked as credit approved THEN the POS System SHALL require a credit limit greater than zero
3. WHEN a credit sale is attempted for a customer THEN the POS System SHALL check if the customer is credit approved
4. WHEN a credit sale would cause a customer's outstanding debt to exceed their credit limit THEN the POS System SHALL block the transaction and display a warning showing available credit
5. WHEN displaying customer details THEN the POS System SHALL show credit limit, current outstanding debt, and available credit for credit-approved customers

### Requirement 8

**User Story:** As a store manager, I want to see debt KPIs on the main dashboard, so that I can quickly assess credit health without navigating to the debt page.

#### Acceptance Criteria

1. WHEN a user views the main dashboard THEN the POS System SHALL display total outstanding debt amount as a KPI card
2. WHEN a user views the main dashboard THEN the POS System SHALL display the number of customers with overdue debts (older than 30 days)
3. WHEN a user views the main dashboard THEN the POS System SHALL display debt collected today
4. WHEN a user clicks on a debt KPI card THEN the POS System SHALL navigate to the debt management page with relevant filters applied

### Requirement 9

**User Story:** As a store owner, I want to record business expenses, so that I can track operational costs and understand profitability.

#### Acceptance Criteria

1. WHEN a user navigates to the expenses page THEN the POS System SHALL display a list of recorded expenses with date, category, description, and amount
2. WHEN a user adds a new expense THEN the POS System SHALL require category, amount, and date fields
3. WHEN a user adds a new expense THEN the POS System SHALL allow an optional description and receipt reference
4. WHEN displaying expenses THEN the POS System SHALL allow filtering by date range and category
5. WHEN displaying expenses THEN the POS System SHALL show a summary of total expenses for the selected period grouped by category

### Requirement 10

**User Story:** As a store owner, I want to manage expense categories, so that I can organize expenses according to my business needs.

#### Acceptance Criteria

1. WHEN a user views expense settings THEN the POS System SHALL display a list of expense categories
2. WHEN a user creates a new expense category THEN the POS System SHALL require a unique category name
3. WHEN a user attempts to delete a category with existing expenses THEN the POS System SHALL prevent deletion and display a warning
4. WHEN the system initializes for a new tenant THEN the POS System SHALL create default expense categories including utilities, rent, supplies, salaries, and miscellaneous

### Requirement 11

**User Story:** As a store owner, I want expense data to be persisted reliably, so that financial records are accurate for accounting purposes.

#### Acceptance Criteria

1. WHEN an expense is recorded THEN the POS System SHALL persist the expense record to the database before confirming success
2. WHEN storing expense data THEN the POS System SHALL serialize expense records using JSON format for the API layer
3. WHEN retrieving expense data THEN the POS System SHALL deserialize JSON responses into typed expense objects
4. WHEN a user edits an expense THEN the POS System SHALL update the record and maintain an audit trail of the modification
