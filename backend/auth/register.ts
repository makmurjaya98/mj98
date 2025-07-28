import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import * as bcrypt from "bcrypt";
import { logActivity } from "./log_activity";

export interface RegisterRequest {
  fullName: string;
  username: string;
  idNumber: string;
  address: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "Owner" | "Admin" | "Mitra Cabang" | "Cabang" | "Link";
  parentId?: number;
  performerId?: number; // ID of user performing the registration, if applicable
}

export interface RegisterResponse {
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
  };
}

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

interface RoleCount {
  count: number;
}

interface ParentUser {
  id: number;
  role: string;
}

// Registers a new user with hierarchical role validation.
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    // Validate required fields
    if (!req.fullName.trim()) {
      throw APIError.invalidArgument("Full name is required");
    }
    
    const lowerCaseUsername = req.username.trim().toLowerCase();
    if (!lowerCaseUsername) {
      throw APIError.invalidArgument("Username is required");
    }

    if (!req.idNumber.trim()) {
      throw APIError.invalidArgument("ID number is required");
    }
    if (!req.address.trim()) {
      throw APIError.invalidArgument("Address is required");
    }
    if (!req.phoneNumber.trim()) {
      throw APIError.invalidArgument("Phone number is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate password strength
    if (req.password.length < 8) {
      throw APIError.invalidArgument("Password must be at least 8 characters long");
    }

    // Validate password confirmation
    if (req.password !== req.confirmPassword) {
      throw APIError.invalidArgument("Passwords do not match");
    }

    // Validate role
    const validRoles = ["Owner", "Admin", "Mitra Cabang", "Cabang", "Link"];
    if (!validRoles.includes(req.role)) {
      throw APIError.invalidArgument("Invalid role selected");
    }

    // Check if username already exists (case-insensitive)
    const existingUsername = await authDB.queryRow`
      SELECT id FROM users WHERE username = ${lowerCaseUsername}
    `;
    if (existingUsername) {
      throw APIError.alreadyExists("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await authDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;
    if (existingEmail) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    // Role-specific validations
    if (req.role === "Owner") {
      const ownerCount = await authDB.queryRow<RoleCount>`
        SELECT COUNT(*) as count FROM users WHERE role = 'Owner'
      `;
      if (ownerCount && ownerCount.count >= 1) {
        throw APIError.failedPrecondition("An Owner is already registered");
      }
      if (req.parentId) {
        throw APIError.invalidArgument("Owner role cannot have a parent");
      }
    } else if (req.role === "Admin") {
      const adminCount = await authDB.queryRow<RoleCount>`
        SELECT COUNT(*) as count FROM users WHERE role = 'Admin'
      `;
      if (adminCount && adminCount.count >= 2) {
        throw APIError.failedPrecondition("Maximum number of admins (2) already registered");
      }
      if (req.parentId) {
        throw APIError.invalidArgument("Admin role cannot have a parent");
      }
    } else if (req.role === "Mitra Cabang") {
      if (req.parentId) {
        throw APIError.invalidArgument("Mitra Cabang role cannot have a parent");
      }
    } else if (req.role === "Cabang") {
      if (!req.parentId) {
        throw APIError.invalidArgument("Cabang role must select a Mitra Cabang parent");
      }
      const parent = await authDB.queryRow<ParentUser>`
        SELECT id, role FROM users WHERE id = ${req.parentId}
      `;
      if (!parent) {
        throw APIError.invalidArgument("Selected parent does not exist");
      }
      if (parent.role !== "Mitra Cabang") {
        throw APIError.invalidArgument("Cabang role must have a Mitra Cabang parent");
      }
    } else if (req.role === "Link") {
      if (!req.parentId) {
        throw APIError.invalidArgument("Link role must select a Cabang parent");
      }
      const parent = await authDB.queryRow<ParentUser>`
        SELECT id, role FROM users WHERE id = ${req.parentId}
      `;
      if (!parent) {
        throw APIError.invalidArgument("Selected parent does not exist");
      }
      if (parent.role !== "Cabang") {
        throw APIError.invalidArgument("Link role must have a Cabang parent");
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(req.password, saltRounds);

    // Create user with lowercase username
    const user = await authDB.queryRow<User>`
      INSERT INTO users (full_name, username, id_number, address, phone_number, email, password_hash, role, parent_id)
      VALUES (${req.fullName}, ${lowerCaseUsername}, ${req.idNumber}, ${req.address}, ${req.phoneNumber}, ${req.email}, ${passwordHash}, ${req.role}, ${req.parentId || null})
      RETURNING id, full_name, username, email, role, created_at, updated_at
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    // Log activity
    await logActivity({
      userId: req.performerId || user.id, // Log as performer or self if no performer
      aksi: "User Registration",
      deskripsi: `New user '${user.username}' (${user.role}) was registered.`,
    });

    return {
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
);
