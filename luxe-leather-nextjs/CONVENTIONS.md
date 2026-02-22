# EducationGlobal Backend - Coding Conventions

> **Master conventions file** - All AI agents and developers must follow these standards.

## Project Overview

- **Framework**: Express.js (Node.js) / Next.js Adapter
- **Database**: MySQL with Sequelize ORM / Supabase Adapter
- **Validation**: Zod
- **Architecture**: MVC + Service Layer Pattern

---

## 1. Project Structure

```
src/
├── config/          # Configuration files (database, multer, etc.)
├── controllers/     # HTTP request handlers (thin, delegate to services)
├── services/        # Business logic layer
├── models/          # Sequelize model definitions
├── routes/          # Express route definitions with Zod schemas
├── middleware/      # Custom middleware (auth, validation, error handling)
├── utils/           # Helper/utility functions
└── server.js        # Application entry point
```

---

## 2. Naming Conventions

| Type             | Convention             | Example                              |
| ---------------- | ---------------------- | ------------------------------------ |
| Files (general)  | camelCase              | `authUtils.js`                       |
| Controller files | camelCase + Controller | `projectController.js`               |
| Service files    | camelCase + Service    | `projectService.js`                  |
| Middleware files | camelCase + Middleware | `authMiddleware.js`                  |
| Route files      | camelCase              | `projectRoutes.js`                   |
| Variables        | camelCase              | `userName`, `isActive`               |
| Constants        | UPPER_SNAKE_CASE       | `MAX_RETRIES`, `API_VERSION`         |
| Functions        | camelCase              | `getUser()`, `validateInput()`       |
| Classes          | PascalCase             | `UserService`, `AuthMiddleware`      |
| Database tables  | snake_case (plural)    | `users`, `user_profiles`             |
| Database columns | snake_case             | `created_at`, `first_name`           |
| Route paths      | kebab-case             | `/api/v1/user-profiles`              |
| Environment vars | UPPER_SNAKE_CASE       | `DATABASE_URL`, `JWT_SECRET`         |
| Zod schemas      | camelCase + Schema     | `createProjectSchema`, `querySchema` |

---

## 3. Code Style

### General Rules

```javascript
// Use single quotes
const name = "EducationGlobal";

// Always use semicolons
const value = 42;

// Use 2 spaces for indentation
function example() {
  if (true) {
    return "yes";
  }
}

// Use const by default, let when reassignment needed, never var
const fixedValue = 100;
let counter = 0;

// Use template literals for string interpolation
const message = `Hello, ${userName}!`;

// Use arrow functions for callbacks
users.map((user) => user.name);

// Use async/await over .then() chains
const data = await fetchData();
```

### Destructuring

```javascript
// Object destructuring
const { name, email } = user;

// Array destructuring
const [first, second] = items;

// Function parameters
const createUser = ({ name, email, password }) => {
  // ...
};
```

---

## 4. Architecture Patterns

### Route Pattern (with Zod Validation)

Routes define validation schemas inline and use JSDoc comments for documentation.
**IMPORTANT**: Every route MUST have JSDoc comments with `@route`, `@desc`, and `@access` tags.

```javascript
// routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");
const { z } = require("zod");
const {
  validateRequest,
  validateParams,
  validateQuery,
} = require("../middleware/validation");

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new project
 * Validates all required and optional fields for project creation
 */
const createProjectSchema = z.object({
  projectName: z.string().min(1).max(255),
  organizationId: z.string().uuid(),
  organizationAddress: z.string().optional(),
  projectType: z.enum(["office", "warehouse"]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  projectDescription: z.string().optional(),
  status: z.enum(["inProgress", "completed", "pending"]).optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  members: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["owner", "manager", "collaborator", "viewer"]).optional(),
      }),
    )
    .optional(),
});

/**
 * Schema for updating an existing project
 * All fields are optional (partial update)
 */
const updateProjectSchema = createProjectSchema.partial();

/**
 * Schema for query parameters
 * Used for filtering, pagination, and sorting
 */
const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

/**
 * Schema for validating UUID path parameters
 */
const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project with optional team members
 * @access  Private - Requires authentication
 * @body    {Object} Project data matching createProjectSchema
 * @returns {Object} Created project with 201 status
 */
router.post(
  "/",
  authenticateToken,
  validateRequest(createProjectSchema),
  projectController.createProject,
);

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects with optional filtering, pagination, and sorting
 * @access  Private - Requires authentication
 * @query   {string} [page=1] - Page number for pagination
 * @query   {string} [limit=10] - Number of items per page
 * @query   {string} [status] - Filter by project status
 * @query   {string} [organizationId] - Filter by organization UUID
 * @query   {string} [search] - Search in project name
 * @query   {string} [sortBy=createdAt] - Field to sort by
 * @query   {string} [sortOrder=DESC] - Sort direction (ASC/DESC)
 * @query   {string} [isActive] - Filter by active status ('true'/'false')
 * @returns {Object} Paginated list of projects
 */
router.get(
  "/",
  authenticateToken,
  validateQuery(querySchema),
  projectController.getAllProjects,
);

/**
 * @route   GET /api/v1/projects/export
 * @desc    Export projects to CSV format with optional filtering
 * @access  Private - Requires authentication
 * @query   {Object} Same query parameters as GET /api/v1/projects
 * @returns {File} CSV file download
 * @note    Static route - must be defined before /:id route
 */
router.get(
  "/export",
  authenticateToken,
  validateQuery(querySchema),
  projectController.exportProjectsCsv,
);

/**
 * @route   GET /api/v1/projects/stats/all
 * @desc    Get project statistics including counts by status
 * @access  Private - Requires authentication
 * @query   {string} [organizationId] - Optional filter by organization
 * @returns {Object} Project statistics (total count, count by status)
 * @note    Static route - must be defined before /:id route
 */
router.get("/stats/all", authenticateToken, projectController.getProjectStats);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get a single project by its UUID
 * @access  Private - Requires authentication
 * @param   {string} id - Project UUID (validated)
 * @returns {Object} Project details with related data
 * @throws  {404} If project not found
 */
router.get(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  projectController.getProjectById,
);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update an existing project by its UUID
 * @access  Private - Requires authentication
 * @param   {string} id - Project UUID
 * @body    {Object} Partial project data matching updateProjectSchema
 * @returns {Object} Updated project data
 * @throws  {404} If project not found
 */
router.put(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  validateRequest(updateProjectSchema),
  projectController.updateProject,
);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete a project by its UUID (soft delete or hard delete based on config)
 * @access  Private - Requires authentication
 * @param   {string} id - Project UUID
 * @returns {Object} Success message
 * @throws  {404} If project not found
 */
router.delete(
  "/:id",
  authenticateToken,
  validateParams(idParamSchema),
  projectController.deleteProject,
);

module.exports = router;
```

### Route Documentation Rules

Every route MUST include:

1. **@route** - HTTP method and full path
2. **@desc** - Clear description of what the route does
3. **@access** - Access level (Public/Private/Admin)
4. **@param** - Path parameters (if any)
5. **@query** - Query parameters (if any)
6. **@body** - Request body (if any)
7. **@returns** - What the route returns
8. **@throws** - Error conditions (if any)
9. **@note** - Special notes (e.g., route ordering)

### Route Ordering Rules

1. **Static routes FIRST**: `/export`, `/stats/all`, `/search`
2. **Parameterized routes LAST**: `/:id`, `/:slug`
3. **More specific before less specific**: `/users/:id/posts` before `/users/:id`

### Common Zod Patterns

```javascript
// ============================================================================
// STRING VALIDATIONS
// ============================================================================

z.string().min(1).max(255); // Required string with length limits
z.string().uuid(); // UUID format
z.string().email(); // Email format
z.string().datetime(); // ISO datetime string
z.string().optional(); // Optional string
z.string().url(); // URL format

// ============================================================================
// ENUM VALIDATIONS
// ============================================================================

z.enum(["option1", "option2"]); // Fixed options (required)
z.enum(["ASC", "DESC"]).optional(); // Optional enum

// ============================================================================
// BOOLEAN FROM QUERY STRING
// ============================================================================

z.enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

// ============================================================================
// ARRAY OF OBJECTS
// ============================================================================

z.array(
  z.object({
    userId: z.string().uuid(),
    role: z.enum(["owner", "manager"]).optional(),
  }),
).optional();

// ============================================================================
// PARTIAL SCHEMA FOR UPDATES
// ============================================================================

const updateSchema = createSchema.partial();

// ============================================================================
// INLINE PARAM VALIDATION
// ============================================================================

validateParams(z.object({ id: z.string().uuid() }));
```

### Controller Pattern (Thin Controllers)

Controllers only handle HTTP concerns - delegate logic to services.

```javascript
// controllers/projectController.js
const projectService = require("../services/projectService");

/**
 * Create a new project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createProject = async (req, res, next) => {
  try {
    const project = await projectService.create(req.body, req.user);
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllProjects = async (req, res, next) => {
  try {
    const result = await projectService.getAll(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single project by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.getById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.update(id, req.body);
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await projectService.remove(id);
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export projects to CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const exportProjectsCsv = async (req, res, next) => {
  try {
    const csv = await projectService.exportCsv(req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=projects.csv");
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProjectStats = async (req, res, next) => {
  try {
    const stats = await projectService.getStats(req.query);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  exportProjectsCsv,
  getProjectStats,
};
```

### Service Pattern (Business Logic)

Services contain all business logic - no HTTP awareness.

```javascript
// services/projectService.js
const { Project, User, Organization } = require("../models");
const { Op } = require("sequelize");

/**
 * Create a new project
 * @param {Object} data - Project data
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>} Created project
 */
const create = async (data, user) => {
  return await Project.create({
    ...data,
    createdBy: user.id,
  });
};

/**
 * Get all projects with filtering and pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated projects with metadata
 */
const getAll = async (query) => {
  const {
    page = "1",
    limit = "10",
    status,
    organizationId,
    search,
    sortBy = "createdAt",
    sortOrder = "DESC",
    isActive,
  } = query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause dynamically
  const where = {};
  if (status) where.status = status;
  if (organizationId) where.organizationId = organizationId;
  if (typeof isActive === "boolean") where.isActive = isActive;
  if (search) {
    where.projectName = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Project.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  };
};

/**
 * Get a project by ID with related data
 * @param {string} id - Project UUID
 * @returns {Promise<Object|null>} Project or null if not found
 */
const getById = async (id) => {
  return await Project.findByPk(id, {
    include: [{ model: Organization }, { model: User, as: "members" }],
  });
};

/**
 * Update a project by ID
 * @param {string} id - Project UUID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated project
 * @throws {Error} If project not found
 */
const update = async (id, data) => {
  const project = await Project.findByPk(id);
  if (!project) {
    throw new Error("Project not found");
  }
  return await project.update(data);
};

/**
 * Delete a project by ID
 * @param {string} id - Project UUID
 * @returns {Promise<void>}
 * @throws {Error} If project not found
 */
const remove = async (id) => {
  const project = await Project.findByPk(id);
  if (!project) {
    throw new Error("Project not found");
  }
  return await project.destroy();
};

/**
 * Export projects to CSV format
 * @param {Object} query - Filter parameters
 * @returns {Promise<string>} CSV string
 */
const exportCsv = async (query) => {
  const { data } = await getAll({ ...query, limit: "10000" });
  // CSV generation logic
  return data.map((p) => `${p.projectName},${p.status}`).join("\n");
};

/**
 * Get project statistics
 * @param {Object} query - Filter parameters
 * @returns {Promise<Object>} Statistics object
 */
const getStats = async (query) => {
  const { organizationId } = query;
  const where = organizationId ? { organizationId } : {};

  const total = await Project.count({ where });
  const byStatus = await Project.findAll({
    where,
    attributes: ["status", [sequelize.fn("COUNT", "id"), "count"]],
    group: ["status"],
  });

  return { total, byStatus };
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  exportCsv,
  getStats,
};
```

### Validation Middleware Pattern

```javascript
// middleware/validation.js
const { z } = require("zod");

/**
 * Validate request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Validate URL path parameters against a Zod schema
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid parameters",
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate query string parameters against a Zod schema
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
  validateParams,
  validateQuery,
};
```

### Model Pattern (Sequelize)

```javascript
// models/Project.js
"use strict";

/**
 * Project Model
 * Represents a project in the system with organization and member associations
 */
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "project_name",
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "organization_id",
      },
      organizationAddress: {
        type: DataTypes.STRING(500),
        field: "organization_address",
      },
      projectType: {
        type: DataTypes.ENUM("office", "warehouse"),
        allowNull: false,
        field: "project_type",
      },
      startDate: {
        type: DataTypes.DATE,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATE,
        field: "end_date",
      },
      projectDescription: {
        type: DataTypes.TEXT,
        field: "project_description",
      },
      status: {
        type: DataTypes.ENUM("inProgress", "completed", "pending"),
        defaultValue: "pending",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
      createdBy: {
        type: DataTypes.UUID,
        field: "created_by",
      },
    },
    {
      tableName: "projects",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  /**
   * Define model associations
   * @param {Object} models - All registered models
   */
  Project.associate = (models) => {
    // Project belongs to an organization
    Project.belongsTo(models.Organization, {
      foreignKey: "organization_id",
    });

    // Project was created by a user
    Project.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });

    // Project has many members (through junction table)
    Project.belongsToMany(models.User, {
      through: "project_members",
      foreignKey: "project_id",
      as: "members",
    });
  };

  return Project;
};
```

---

## 5. API Response Format

### Success Response

```javascript
// Single item
{
  "success": true,
  "data": { ... }
}

// List with pagination
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Action success
{
  "success": true,
  "message": "Resource created successfully"
}
```

### Error Response

```javascript
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",           // Optional
  "details": [                     // For validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Code | Usage                            |
| ---- | -------------------------------- |
| 200  | Success (GET, PUT, DELETE)       |
| 201  | Created (POST)                   |
| 400  | Bad Request (validation error)   |
| 401  | Unauthorized (not authenticated) |
| 403  | Forbidden (not authorized)       |
| 404  | Not Found                        |
| 409  | Conflict (duplicate)             |
| 500  | Internal Server Error            |

---

## 6. Error Handling

### Custom Error Class

```javascript
// utils/AppError.js

/**
 * Custom application error class
 * Extends native Error with status code and operational flag
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string|null} code - Optional error code
   */
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Error Middleware

```javascript
// middleware/errorMiddleware.js

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error response
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong";

  // Log error for debugging (not in production response)
  console.error("Error:", err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```

---

## 7. Auth Middleware Pattern

```javascript
// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Authenticate JWT token from Authorization header
 * Attaches decoded user to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401, "NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }
};

/**
 * Require admin role for access
 * Must be used after authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403, "FORBIDDEN"));
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
```

---

## 8. Comment Standards

### File Header Comment

```javascript
/**
 * @fileoverview Project routes - handles all project-related HTTP endpoints
 * @module routes/projectRoutes
 * @requires express
 * @requires zod
 */
```

### Section Dividers

```javascript
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// ============================================================================
// ROUTES
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
```

### Function Comments (JSDoc)

```javascript
/**
 * Brief description of what the function does
 * @param {string} id - Description of parameter
 * @param {Object} options - Description of options object
 * @param {boolean} options.active - Whether item is active
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When something goes wrong
 * @example
 * const result = await myFunction('123', { active: true });
 */
```

### Inline Comments

```javascript
// Single line comment for brief explanations

// TODO: Add pagination support
// FIXME: Handle edge case for empty array
// NOTE: This is intentionally simplified for now
// HACK: Temporary workaround for issue #123
// REVIEW: Consider refactoring this section
```

---

## 9. Do's and Don'ts

### Do

- Use async/await for all asynchronous operations
- Validate all user inputs using Zod
- Use environment variables for secrets and config
- Use meaningful variable and function names
- Handle all errors appropriately
- Use transactions for multiple database operations
- Keep controllers thin, services fat
- Write pure functions when possible
- Define Zod schemas at the top of route files
- Use JSDoc comments for all routes and functions
- Place static routes before parameterized routes
- Add section dividers for code organization

### Don't

- Never use `var`, always use `const` or `let`
- Never commit `.env` files or secrets
- Never use `console.log` in production (use proper logger)
- Never expose internal error details to clients
- Never trust user input without validation
- Never trust user input without validation
- Never store passwords in plain text
- Never use synchronous file operations in request handlers
- Never ignore promise rejections
- Never put validation schemas in separate files (keep in route file)
- Never place `/:id` routes before static routes like `/export`
- Never skip JSDoc comments on routes

---

## 10. Import Order

```javascript
// 1. Node.js built-in modules
const path = require("path");
const fs = require("fs");

// 2. External packages
const express = require("express");
const { z } = require("zod");

// 3. Internal modules - middleware
const { authenticateToken } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validation");

// 4. Internal modules - controllers/services
const projectController = require("../controllers/projectController");
```

---

## 11. Environment Variables

Required in `.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=education_global
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_MAX_SIZE=5242880
```

---

## 12. Sequelize Model Patterns

### Pattern 1: Model Definition (Functional Export)

Each model file exports a function that receives `sequelize` and `DataTypes`.
**No associations inside model files** - keep models focused on field definitions only.

```javascript
// models/Organization.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    "Organization",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      domain: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "Organizations",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["code"],
        },
      ],
      hooks: {
        beforeUpdate: (instance) => {
          instance.updatedAt = new Date();
        },
      },
    },
  );

  return Organization;
};
```

### Model Definition Rules

| Aspect       | Convention                                    |
| ------------ | --------------------------------------------- |
| Export style | Functional `(sequelize, DataTypes) => {...}`  |
| Primary key  | UUID with `UUIDV4` default                    |
| Table name   | PascalCase plural in `tableName` option       |
| Timestamps   | Always `true` (auto `createdAt`, `updatedAt`) |
| Indexes      | Define in model options                       |
| Hooks        | Define in model options                       |
| Associations | **NEVER** in model file - use `index.js`      |

### Pattern 2: Centralized Index (Explicit Imports & Associations)

All model imports and associations are defined in `models/index.js`.

```javascript
// models/index.js
"use strict";

const { Sequelize, DataTypes } = require("sequelize");
const process = require("process");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.json")[env];

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

// ============================================================================
// IMPORT MODELS
// ============================================================================

const Organization = require("./Organization")(sequelize, DataTypes);
const User = require("./User")(sequelize, DataTypes);
const Project = require("./Project")(sequelize, DataTypes);
const ProjectMember = require("./ProjectMember")(sequelize, DataTypes);

// ============================================================================
// SETUP ASSOCIATIONS
// ============================================================================

const setupAssociations = () => {
  // 🏢 Organization → Project
  Organization.hasMany(Project, {
    foreignKey: "organizationId",
    as: "projects",
  });
  Project.belongsTo(Organization, {
    foreignKey: "organizationId",
    as: "organization",
  });

  // 👤 Project creator
  Project.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

  // 🧑🤝🧑 Project Members (Many-to-Many)
  User.belongsToMany(Project, {
    through: ProjectMember,
    foreignKey: "userId",
    otherKey: "projectId",
    as: "assignedProjects",
  });
  Project.belongsToMany(User, {
    through: ProjectMember,
    foreignKey: "projectId",
    otherKey: "userId",
    as: "teamMembers",
  });
};

setupAssociations();

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sequelize,
  Sequelize,
  Organization,
  User,
  Project,
  ProjectMember,
};
```

### Index.js Rules

| Aspect       | Convention                                 |
| ------------ | ------------------------------------------ |
| Imports      | Explicit, manual imports (no auto-loading) |
| Model init   | `require('./Model')(sequelize, DataTypes)` |
| Associations | All in `setupAssociations()` function      |
| Grouping     | Use emoji comments for logical grouping    |
| Exports      | Named exports for each model               |

### Association Patterns

```javascript
// One-to-Many
Organization.hasMany(Project, { foreignKey: "organizationId", as: "projects" });
Project.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

// Many-to-Many (through junction table)
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId",
  as: "assignedProjects",
});

// One-to-One
User.hasOne(UserProfile, {
  foreignKey: "userId",
  as: "profile",
  onDelete: "CASCADE",
});
UserProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

// With cascade options
Organization.hasMany(Project, {
  foreignKey: "organizationId",
  as: "projects",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
```

### Adding a New Model Checklist

1. **Create model file** (`models/NewModel.js`):
   - Use functional export pattern
   - Define fields with proper types and validations
   - Add indexes and hooks in options
   - **Do NOT add associations**

2. **Update `models/index.js`**:
   - Add import: `const NewModel = require('./NewModel')(sequelize, DataTypes);`
   - Add associations in `setupAssociations()`
   - Add to exports: `module.exports = { ..., NewModel };`

3. **Create migration** (if using migrations):
   - Run: `npx sequelize-cli migration:generate --name create-new-model`
   - Define table structure matching model

---

## Quick Reference Card

```
Files:          projectController.js, projectService.js, projectRoutes.js
Variables:      userName, isActive
Constants:      MAX_LIMIT, API_VERSION
Functions:      getUser(), validateInput()
Classes:        UserService, AppError
DB Tables:      Organizations, Projects (PascalCase in tableName)
DB Columns:     first_name, created_at
Routes:         /api/v1/projects, /api/v1/user-profiles
Env Vars:       DATABASE_URL, JWT_SECRET
Zod Schemas:    createProjectSchema, querySchema

Route Comments: @route, @desc, @access, @param, @query, @body, @returns, @throws
Section Dividers: // ====... SECTION NAME ...====

Model Pattern:  Functional export (sequelize, DataTypes) => {...}
Associations:   Centralized in models/index.js → setupAssociations()
Model Exports:  Named exports { Model1, Model2 }
Primary Key:    UUID with UUIDV4
```
