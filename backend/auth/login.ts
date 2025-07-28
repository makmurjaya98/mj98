import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import * as bcrypt from "bcrypt";
import { logActivity } from "./log_activity";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  full_name: string;
}

// Authenticates a user with username and password.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const lowerCaseUsername = req.username.trim().toLowerCase();

    // Find user by username (case-insensitive)
    const user = await authDB.queryRow<User>`
      SELECT id, email, password_hash, role, full_name
      FROM users
      WHERE username = ${lowerCaseUsername}
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    
    if (!isValidPassword) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    // Log successful login
    await logActivity({
      userId: user.id,
      aksi: "Login",
      deskripsi: `User successfully logged in.`,
    });

    // Generate a simple token (in production, use JWT or similar)
    const token = generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    };
  }
);

function generateToken(userId: number): string {
  // Simple token generation - in production, use JWT with proper signing
  const timestamp = Date.now();
  const randomBytes = Math.random().toString(36).substring(2);
  return `${userId}_${timestamp}_${randomBytes}`;
}
